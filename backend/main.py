import os, math, time, hashlib, secrets, threading, string, hmac
from datetime import datetime, timedelta
import jwt
from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

SECRET = os.getenv("SECRET_KEY", "cine360-super-secret-key-2026")
HOLD = int(os.getenv("HOLD_SECONDS", "600"))  # 10 minutes hold
URL = os.getenv("DATABASE_URL", "sqlite:///./cine.db")
TMDB_API_KEY = os.getenv("TMDB_API_KEY", "")
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")

engine = create_engine(URL, connect_args={"check_same_thread": False} if URL.startswith("sqlite") else {})
Session = sessionmaker(engine, expire_on_commit=False)
Base = declarative_base()

TIERS = {"Normal": 1.0, "Executive": 1.35, "Premium": 1.75}
CITIES = ["Chennai", "Bengaluru", "Hyderabad", "Mumbai", "Delhi"]

# ==================== MODELS ====================

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    email = Column(String, unique=True)
    pw = Column(String)
    role = Column(String, default="user")  # user, admin, staff

class Movie(Base):
    __tablename__ = "movies"
    id = Column(Integer, primary_key=True)
    title = Column(String)
    genre = Column(String)
    genres = Column(JSON, default=list)
    language = Column(String, default="English")
    languages = Column(JSON, default=list)
    minutes = Column(Integer, default=120)
    rating = Column(Float, default=8.5)
    certificate = Column(String, default="UA 16+")
    director = Column(String, default="")
    cast = Column(JSON, default=list)
    formats = Column(JSON, default=list)
    synopsis = Column(String, default="")
    blurb = Column(String, default="")
    poster_url = Column(String, default="")
    backdrop_url = Column(String, default="")
    trailer_url = Column(String, default="")
    c1 = Column(String, default="#0f172a")
    c2 = Column(String, default="#4f7cff")

class Theatre(Base):
    __tablename__ = "theatres"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    city = Column(String)
    layout = Column(JSON)
    amenities = Column(JSON, default=list)
    formats_supported = Column(JSON, default=list)
    cancellation_available = Column(Boolean, default=True)

class Show(Base):
    __tablename__ = "shows"
    id = Column(Integer, primary_key=True)
    movie_id = Column(ForeignKey("movies.id"))
    theatre_id = Column(ForeignKey("theatres.id"))
    start = Column(DateTime)
    price = Column(Float)
    format = Column(String, default="2D")
    language = Column(String, default="English")
    movie = relationship("Movie")
    theatre = relationship("Theatre")

class FoodItem(Base):
    __tablename__ = "food_items"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    category = Column(String)  # Popcorn, Combos, Beverages, Snacks
    price = Column(Float)
    image_url = Column(String)
    description = Column(String, default="")

class PromoCode(Base):
    __tablename__ = "promo_codes"
    id = Column(Integer, primary_key=True)
    code = Column(String, unique=True)
    discount_type = Column(String)  # percent, flat
    discount_val = Column(Float)
    min_order = Column(Float, default=0.0)
    max_discount = Column(Float, default=500.0)
    active = Column(Boolean, default=True)

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True)
    ref = Column(String, unique=True)
    user_id = Column(ForeignKey("users.id"))
    show_id = Column(ForeignKey("shows.id"))
    seats = Column(JSON)
    subtotal = Column(Float)
    fee = Column(Float)
    gst = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    promo_code = Column(String, default="")
    food_total = Column(Float, default=0.0)
    food_items = Column(JSON, default=list)
    total = Column(Float)
    payment_method = Column(String, default="card")
    payment_id = Column(String, default="")
    status = Column(String, default="confirmed")  # confirmed, cancelled, checked_in
    qr_token = Column(String, default="")
    checked_in_at = Column(DateTime, nullable=True)
    refund_amount = Column(Float, default=0.0)
    refund_status = Column(String, default="none")
    created = Column(DateTime, default=datetime.utcnow)
    show = relationship("Show")
    user = relationship("User")

class BookedSeat(Base):
    __tablename__ = "booked_seats"
    id = Column(Integer, primary_key=True)
    show_id = Column(ForeignKey("shows.id"))
    seat = Column(String)
    booking_id = Column(ForeignKey("bookings.id"))
    __table_args__ = (UniqueConstraint("show_id", "seat"),)

class MovieRating(Base):
    __tablename__ = "movie_ratings"
    id = Column(Integer, primary_key=True)
    movie_id = Column(ForeignKey("movies.id"))
    user_id = Column(ForeignKey("users.id"))
    rating = Column(Float)
    review = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User")

# ==================== 3D GEOMETRY + SCORE ====================

def build_seats(L):
    sw = L.get("seat_w", 0.7)
    aw = L.get("aisle_w", 1.2)
    rd = L.get("row_d", 1.1)
    rake = L.get("rake", 0.3)
    out = []
    for i, row in enumerate(L["rows"]):
        n = row["seats"]
        aisles = row.get("aisles", L.get("aisles", []))
        x = -(n * sw + len(aisles) * aw) / 2 + sw / 2
        z = L["front"] + i * rd
        for j in range(n):
            out.append(dict(
                id=f"{row['label']}{j+1}",
                row=row["label"],
                num=j+1,
                tier=row.get("tier", "Normal"),
                x=round(x, 2),
                y=round(i * rake, 2),
                z=round(z, 2)
            ))
            x += sw + (aw if (j + 1) in aisles else 0)
    return out

def score(L, s):
    sc = L["screen"]
    W, H, b = sc["width"], sc["height"], sc["bottom"]
    x, z, eye = s["x"], s["z"], s["y"] + 1.1
    ang = math.degrees(math.atan2(W / 2 - x, z) + math.atan2(W / 2 + x, z))
    off = math.degrees(math.atan2(abs(x), z))
    tilt = math.degrees(math.atan2(b + H / 2 - eye, z))
    g = lambda v, m, sd: math.exp(-((v - m) / sd) ** 2 / 2)
    sco = round(100 * (0.45 * g(ang, 42, 14) + 0.30 * g(off, 0, 22) + 0.25 * g(tilt, 6, 14)))
    lab = "Prime" if sco >= 85 else "Great" if sco >= 70 else "Good" if sco >= 50 else "Compromised"
    tip = "Screen fills your view perfectly" if 34 <= ang <= 50 else "Very close - expect wide field immersion" if ang > 50 else "Farther back - comprehensive overall view"
    return dict(score=sco, label=lab, angle=round(ang), off_axis=round(off), neck_tilt=round(tilt), distance=round(math.hypot(x, z), 1), tip=tip)

# ==================== SEAT LOCKS ====================

class Locks:
    def __init__(s):
        s.mem, s.mu, s.r = {}, threading.Lock(), None
        if os.getenv("REDIS_URL"):
            try:
                import redis
                s.r = redis.from_url(os.environ["REDIS_URL"], decode_responses=True)
            except Exception:
                s.r = None
    def acquire(s, sid, seat, uid):
        k, uid = f"lock:{sid}:{seat}", str(uid)
        if s.r:
            try:
                if s.r.set(k, uid, nx=True, ex=HOLD): return True
                if s.r.get(k) == uid:
                    s.r.expire(k, HOLD)
                    return True
                return False
            except Exception:
                pass
        with s.mu:
            v = s.mem.get(k)
            if v and v[1] > time.time() and v[0] != uid: return False
            s.mem[k] = (uid, time.time() + HOLD)
            return True
    def release(s, sid, seat, uid):
        k = f"lock:{sid}:{seat}"
        if s.r:
            try:
                if s.r.get(k) == str(uid): s.r.delete(k)
            except Exception: pass
        with s.mu:
            if s.mem.get(k, (None,))[0] == str(uid): s.mem.pop(k, None)
    def held(s, sid):
        if s.r:
            try:
                return {k.split(":")[2]: s.r.get(k) for k in s.r.scan_iter(f"lock:{sid}:*")}
            except Exception: pass
        with s.mu:
            return {k.split(":")[2]: v[0] for k, v in s.mem.items() if k.startswith(f"lock:{sid}:") and v[1] > time.time()}

locks = Locks()

# ==================== WEBSOCKETS ====================

rooms = {}
async def push(sid):
    for w in list(rooms.get(sid, ())):
        try:
            await w.send_text("refresh")
        except Exception:
            rooms.get(sid, set()).discard(w)

# ==================== AUTH & SECURITY ====================

def hp(p, salt=None):
    salt = salt or secrets.token_hex(8)
    return salt + "$" + hashlib.pbkdf2_hmac("sha256", p.encode(), salt.encode(), 100000).hex()

def make_qr_token(ref: str, show_id: int, user_id: int):
    payload = {
        "ref": ref,
        "show_id": show_id,
        "uid": user_id,
        "t": int(time.time()),
        "aud": "cine360:ticket"
    }
    return jwt.encode(payload, SECRET, algorithm="HS256")

def decode_qr_token(token: str):
    try:
        return jwt.decode(token, SECRET, algorithms=["HS256"], audience="cine360:ticket")
    except Exception:
        return None

bearer = HTTPBearer(auto_error=False)

def db():
    s = Session()
    try:
        yield s
    finally:
        s.close()

def opt_user(c=Depends(bearer), d=Depends(db)):
    if not c: return None
    try:
        decoded = jwt.decode(c.credentials, SECRET, algorithms=["HS256"])
        return d.get(User, int(decoded["sub"]))
    except Exception:
        return None

def need(u=Depends(opt_user)):
    if not u: raise HTTPException(401, "Login required")
    return u

def admin(u=Depends(need)):
    if u.role != "admin": raise HTTPException(403, "Admins only")
    return u

def staff_or_admin(u=Depends(need)):
    if u.role not in ("staff", "admin"): raise HTTPException(403, "Staff access required")
    return u

def token(u):
    tok = jwt.encode({"sub": str(u.id), "role": u.role, "exp": datetime.utcnow() + timedelta(days=7)}, SECRET, algorithm="HS256")
    return dict(token=tok, id=u.id, name=u.name, email=u.email, role=u.role)

# ==================== APP & ROUTER ====================

app = FastAPI(title="CINE360 - 3D Cinema Ecosystem")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Schemas
class Reg(BaseModel):
    name: str
    email: str
    password: str
    role: str = "user"

class Login(BaseModel):
    email: str
    password: str

class SeatsHoldIn(BaseModel):
    seats: list[str]

class FoodItemIn(BaseModel):
    id: int
    name: str
    price: float
    qty: int

class BookIn(BaseModel):
    show_id: int
    seats: list[str]
    card: str = ""
    payment_method: str = "card"
    promo_code: str = ""
    food_items: list[FoodItemIn] = Field(default_factory=list)
    razorpay_order_id: str = ""
    razorpay_payment_id: str = ""
    razorpay_signature: str = ""

class PromoCheck(BaseModel):
    code: str
    subtotal: float

class ScanIn(BaseModel):
    qr_token: str = ""
    ref: str = ""

class RateIn(BaseModel):
    rating: float
    review: str = ""

# ==================== AUTH ROUTES ====================

@app.post("/api/auth/register")
def register(b: Reg, d=Depends(db)):
    if d.query(User).filter_by(email=b.email.lower()).first():
        raise HTTPException(409, "Email already registered")
    u = User(name=b.name, email=b.email.lower(), pw=hp(b.password), role=b.role)
    d.add(u)
    d.commit()
    return token(u)

@app.post("/api/auth/login")
def login(b: Login, d=Depends(db)):
    u = d.query(User).filter_by(email=b.email.lower()).first()
    if not u or hp(b.password, u.pw.split("$")[0]) != u.pw:
        raise HTTPException(401, "Wrong email or password")
    return token(u)

@app.get("/api/auth/me")
def me(u=Depends(need)):
    return dict(id=u.id, name=u.name, email=u.email, role=u.role)

# ==================== CITIES & FOOD ====================

@app.get("/api/cities")
def get_cities():
    return CITIES

@app.get("/api/food-items")
def get_food_items(d=Depends(db)):
    items = d.query(FoodItem).all()
    return [dict(
        id=f.id,
        name=f.name,
        category=f.category,
        price=f.price,
        image_url=f.image_url,
        description=f.description
    ) for f in items]

# ==================== PROMO CODES ====================

@app.post("/api/promo/validate")
def validate_promo(b: PromoCheck, d=Depends(db)):
    code_str = b.code.strip().upper()
    promo = d.query(PromoCode).filter_by(code=code_str, active=True).first()
    if not promo:
        raise HTTPException(404, "Invalid or expired promo code")
    if b.subtotal < promo.min_order:
        raise HTTPException(400, f"Minimum ticket value of ₹{promo.min_order} required for this coupon")
    if promo.discount_type == "percent":
        discount = round(b.subtotal * (promo.discount_val / 100.0), 2)
        discount = min(discount, promo.max_discount)
    else:
        discount = min(promo.discount_val, b.subtotal)
    return dict(
        code=promo.code,
        discount=discount,
        type=promo.discount_type,
        value=promo.discount_val,
        message=f"Applied! You save ₹{discount}"
    )

# ==================== MOVIES ====================

def movie_payload(m):
    return dict(
        id=m.id,
        title=m.title,
        genre=m.genre,
        genres=m.genres or [m.genre],
        language=m.language,
        languages=m.languages or [m.language],
        minutes=m.minutes,
        rating=m.rating,
        certificate=m.certificate,
        director=m.director,
        cast=m.cast or [],
        formats=m.formats or ["2D", "3D"],
        synopsis=m.synopsis or m.blurb,
        blurb=m.blurb or m.synopsis,
        poster_url=m.poster_url,
        backdrop_url=m.backdrop_url,
        trailer_url=m.trailer_url,
        c1=m.c1,
        c2=m.c2
    )

@app.get("/api/movies")
def get_movies(
    city: str = Query("", description="City filter"),
    genre: str = Query("", description="Genre filter"),
    search: str = Query("", description="Search term"),
    d=Depends(db)
):
    q = d.query(Movie)
    movies_list = q.all()
    out = []
    search_lower = search.strip().lower()
    genre_lower = genre.strip().lower()

    for m in movies_list:
        if search_lower:
            match_title = search_lower in m.title.lower()
            match_syn = search_lower in (m.synopsis or "").lower()
            match_dir = search_lower in (m.director or "").lower()
            if not (match_title or match_syn or match_dir):
                continue
        if genre_lower and genre_lower != "all":
            genres_all = [g.lower() for g in (m.genres or [m.genre])]
            if not any(genre_lower in g for g in genres_all):
                continue
        if city:
            # Check if this movie has any shows in this city
            has_city_show = d.query(Show).join(Theatre).filter(
                Show.movie_id == m.id,
                Theatre.city == city,
                Show.start > datetime.utcnow()
            ).first()
            if not has_city_show:
                continue
        out.append(movie_payload(m))
    return out

@app.get("/api/movies/{mid}")
def get_movie_detail(mid: int, city: str = "", d=Depends(db)):
    m = d.get(Movie, mid)
    if not m:
        raise HTTPException(404, "Movie not found")
    sq = d.query(Show).join(Theatre).filter(Show.movie_id == mid, Show.start > datetime.utcnow()).order_by(Show.start)
    if city:
        sq = sq.filter(Theatre.city == city)
    shows_list = sq.all()
    return dict(
        **movie_payload(m),
        shows=[dict(
            id=s.id,
            start=s.start.isoformat() + "Z",
            price=s.price,
            format=s.format,
            language=s.language,
            theatre_id=s.theatre.id,
            theatre=s.theatre.name,
            city=s.theatre.city,
            amenities=s.theatre.amenities or [],
            cancellation=s.theatre.cancellation_available
        ) for s in shows_list]
    )

@app.get("/api/movies/{mid}/ratings")
def get_ratings(mid: int, d=Depends(db)):
    ratings = d.query(MovieRating).filter_by(movie_id=mid).order_by(MovieRating.id.desc()).all()
    return [dict(
        id=r.id,
        user=r.user.name,
        rating=r.rating,
        review=r.review,
        created=r.created_at.isoformat() + "Z"
    ) for r in ratings]

@app.post("/api/movies/{mid}/rate")
def rate_movie(mid: int, b: RateIn, u=Depends(need), d=Depends(db)):
    existing = d.query(MovieRating).filter_by(movie_id=mid, user_id=u.id).first()
    if existing:
        existing.rating = b.rating
        existing.review = b.review
        d.commit()
        return dict(success=True, message="Rating updated")
    r = MovieRating(movie_id=mid, user_id=u.id, rating=b.rating, review=b.review)
    d.add(r)
    d.commit()
    return dict(success=True, message="Rating submitted")

# ==================== THEATRES ====================

@app.get("/api/theatres")
def get_theatres(city: str = "", d=Depends(db)):
    q = d.query(Theatre)
    if city:
        q = q.filter_by(city=city)
    ths = q.all()
    return [dict(
        id=t.id,
        name=t.name,
        city=t.city,
        amenities=t.amenities or ["Dolby Atmos", "Recliners"],
        formats=t.formats_supported or ["2D", "3D", "IMAX"],
        cancellation=t.cancellation_available,
        layout=t.layout
    ) for t in ths]

@app.get("/api/theatres/{tid}")
def get_theatre(tid: int, d=Depends(db)):
    t = d.get(Theatre, tid)
    if not t: raise HTTPException(404, "Theatre not found")
    return dict(
        id=t.id,
        name=t.name,
        city=t.city,
        amenities=t.amenities or [],
        formats=t.formats_supported or [],
        cancellation=t.cancellation_available,
        layout=t.layout,
        seats=build_seats(t.layout)
    )

# ==================== SHOWS & SEATS ====================

def show_seat_payload(show, d, uid=None):
    L = show.theatre.layout
    mult = L.get("tiers", TIERS)
    booked = {r.seat for r in d.query(BookedSeat).filter_by(show_id=show.id)}
    held = locks.held(show.id)
    out = []
    for s in build_seats(L):
        h = held.get(s["id"])
        st = "booked" if s["id"] in booked else "mine" if (h and uid and h == str(uid)) else "held" if h else "free"
        out.append({
            **s,
            **score(L, s),
            "price": round(show.price * mult.get(s["tier"], 1.0)),
            "status": st
        })
    return out

def get_show(d, sid: int):
    s = d.get(Show, sid)
    if not s: raise HTTPException(404, "Show not found")
    return s

@app.get("/api/shows/{sid}")
def show_detail(sid: int, u=Depends(opt_user), d=Depends(db)):
    s = get_show(d, sid)
    seats = show_seat_payload(s, d, u.id if u else None)
    booked_count = sum(1 for st in seats if st["status"] == "booked")
    total_seats = len(seats)
    fill_ratio = booked_count / max(total_seats, 1)
    status_label = "Almost full" if fill_ratio > 0.8 else "Filling fast" if fill_ratio > 0.4 else "Available"
    return dict(
        id=s.id,
        start=s.start.isoformat() + "Z",
        price=s.price,
        format=s.format,
        language=s.language,
        movie=movie_payload(s.movie),
        theatre=s.theatre.name,
        city=s.theatre.city,
        amenities=s.theatre.amenities or [],
        cancellation=s.theatre.cancellation_available,
        screen=s.theatre.layout["screen"],
        seats=seats,
        availability=dict(booked=booked_count, total=total_seats, status=status_label)
    )

@app.get("/api/shows/{sid}/recommend")
def recommend_seats(sid: int, count: int = 2, u=Depends(opt_user), d=Depends(db)):
    rows = {}
    for s in show_seat_payload(get_show(d, sid), d, u.id if u else None):
        rows.setdefault(s["row"], []).append(s)
    best = []
    for r in rows.values():
        for i in range(len(r) - count + 1):
            w = r[i:i + count]
            if all(x["status"] in ("free", "mine") for x in w) and all(abs(w[k + 1]["x"] - w[k]["x"]) < 0.9 for k in range(count - 1)):
                best.append(dict(
                    seats=[x["id"] for x in w],
                    score=round(sum(x["score"] for x in w) / count),
                    price=sum(x["price"] for x in w),
                    tier=w[0]["tier"]
                ))
    return sorted(best, key=lambda b: -b["score"])[:4]

@app.post("/api/shows/{sid}/hold")
def hold_seats(sid: int, b: SeatsHoldIn, bg: BackgroundTasks, u=Depends(need), d=Depends(db)):
    show = get_show(d, sid)
    if len(b.seats) > 8:
        raise HTTPException(400, "Max 8 seats per booking")
    valid = {s["id"] for s in build_seats(show.theatre.layout)}
    booked = {r.seat for r in d.query(BookedSeat).filter_by(show_id=sid)}
    if set(b.seats) - valid or set(b.seats) & booked:
        raise HTTPException(409, "Some selected seats are no longer available")
    mine = {k for k, v in locks.held(sid).items() if v == str(u.id)}
    for s in mine - set(b.seats):
        locks.release(sid, s, u.id)
    got = []
    for s in b.seats:
        if locks.acquire(sid, s, u.id):
            got.append(s)
        else:
            for g in got:
                if g not in mine: locks.release(sid, g, u.id)
            raise HTTPException(409, f"Seat {s} was just taken by someone else")
    bg.add_task(push, sid)
    return dict(held=got, expires_in=HOLD)

@app.delete("/api/shows/{sid}/hold")
def unhold_seats(sid: int, bg: BackgroundTasks, u=Depends(need)):
    for k, v in locks.held(sid).items():
        if v == str(u.id):
            locks.release(sid, k, u.id)
    bg.add_task(push, sid)
    return dict(expires_in=0)

# ==================== PAYMENT & BOOKINGS ====================

def booking_payload(b):
    return dict(
        ref=b.ref,
        movie=b.show.movie.title,
        poster_url=b.show.movie.poster_url,
        theatre=b.show.theatre.name,
        city=b.show.theatre.city,
        format=b.show.format,
        start=b.show.start.isoformat() + "Z",
        seats=b.seats,
        subtotal=b.subtotal,
        fee=b.fee,
        gst=b.gst,
        discount=b.discount,
        food_total=b.food_total,
        food_items=b.food_items or [],
        total=b.total,
        payment_method=b.payment_method,
        status=b.status,
        qr_token=b.qr_token,
        checked_in_at=b.checked_in_at.isoformat() + "Z" if b.checked_in_at else None,
        refund_amount=b.refund_amount,
        refund_status=b.refund_status,
        created=b.created.isoformat() + "Z"
    )

@app.post("/api/payments/razorpay/create-order")
def create_razorpay_order(data: dict, u=Depends(need)):
    amount = int(float(data.get("amount", 0)) * 100)  # in paise
    if amount <= 0: raise HTTPException(400, "Invalid amount")
    if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
        try:
            import httpx
            auth = (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
            res = httpx.post(
                "https://api.razorpay.com/v1/orders",
                auth=auth,
                json={"amount": amount, "currency": "INR", "receipt": secrets.token_hex(4).upper()}
            )
            if res.is_success:
                return res.json()
        except Exception as e:
            pass
    # Fallback mock order if credentials not configured
    mock_order = {
        "id": "order_" + secrets.token_hex(7),
        "entity": "order",
        "amount": amount,
        "amount_paid": 0,
        "amount_due": amount,
        "currency": "INR",
        "receipt": secrets.token_hex(4).upper(),
        "status": "created",
        "key_id": RAZORPAY_KEY_ID or "rzp_test_cine360mock"
    }
    return mock_order

@app.post("/api/bookings")
def book_seats(b: BookIn, bg: BackgroundTasks, u=Depends(need), d=Depends(db)):
    show = get_show(d, b.show_id)
    held_seats = {k for k, v in locks.held(b.show_id).items() if v == str(u.id)}
    if not b.seats or set(b.seats) - held_seats:
        raise HTTPException(409, "Your seat hold expired or is incomplete. Please select your seats again.")
    if b.card.replace(" ", "") == "4000000000000002":
        raise HTTPException(402, "Payment declined by issuing bank (mock card testing error)")

    # Calculate pricing
    seat_prices = {s["id"]: s["price"] for s in show_seat_payload(show, d, u.id)}
    sub = sum(seat_prices.get(s, show.price) for s in b.seats)
    fee = round(sub * 0.03, 2)  # 3% convenience fee
    gst = round(fee * 0.18, 2)  # 18% GST on convenience fee

    # Discount calculation
    discount = 0.0
    if b.promo_code:
        promo = d.query(PromoCode).filter_by(code=b.promo_code.upper(), active=True).first()
        if promo and sub >= promo.min_order:
            if promo.discount_type == "percent":
                discount = min(round(sub * (promo.discount_val / 100.0), 2), promo.max_discount)
            else:
                discount = min(promo.discount_val, sub)

    # Food total
    food_total = round(sum(item.price * item.qty for item in b.food_items), 2)
    food_json = [item.model_dump() for item in b.food_items]

    total = round(sub + fee + gst + food_total - discount, 2)
    ref = secrets.token_hex(4).upper()
    qr_token = make_qr_token(ref, show.id, u.id)

    bk = Booking(
        ref=ref,
        user_id=u.id,
        show_id=show.id,
        seats=b.seats,
        subtotal=sub,
        fee=fee,
        gst=gst,
        discount=discount,
        promo_code=b.promo_code.upper() if discount > 0 else "",
        food_total=food_total,
        food_items=food_json,
        total=total,
        payment_method=b.payment_method,
        payment_id=b.razorpay_payment_id or ("pay_" + secrets.token_hex(6)),
        status="confirmed",
        qr_token=qr_token,
        refund_status="none",
        created=datetime.utcnow()
    )
    d.add(bk)
    d.flush()

    for s in b.seats:
        d.add(BookedSeat(show_id=show.id, seat=s, booking_id=bk.id))

    try:
        d.commit()
    except IntegrityError:
        d.rollback()
        raise HTTPException(409, "One or more seats were already booked")

    for s in b.seats:
        locks.release(show.id, s, u.id)

    bg.add_task(push, show.id)
    return booking_payload(bk)

@app.get("/api/bookings/me")
def my_bookings(u=Depends(need), d=Depends(db)):
    bookings = d.query(Booking).filter_by(user_id=u.id).order_by(Booking.id.desc()).all()
    return [booking_payload(b) for b in bookings]

@app.post("/api/bookings/{ref}/cancel")
def cancel_booking(ref: str, bg: BackgroundTasks, u=Depends(need), d=Depends(db)):
    b = d.query(Booking).filter_by(ref=ref, user_id=u.id).first()
    if not b: raise HTTPException(404, "Booking not found")
    if b.status != "confirmed": raise HTTPException(400, f"Booking is already {b.status}")
    now = datetime.utcnow()
    # Refund rules: full refund if > 2 hours before show
    if b.show.start - now < timedelta(hours=2):
        raise HTTPException(400, "Cancellations strictly close 2 hours before the scheduled showtime")

    d.query(BookedSeat).filter_by(booking_id=b.id).delete()
    b.status = "cancelled"
    b.refund_amount = b.total
    b.refund_status = "processed"
    d.commit()
    bg.add_task(push, b.show_id)
    return booking_payload(b)

# ==================== STAFF SCANNER ====================

@app.post("/api/staff/scan")
def scan_ticket(b: ScanIn, u=Depends(staff_or_admin), d=Depends(db)):
    bk = None
    if b.qr_token:
        decoded = decode_qr_token(b.qr_token)
        if not decoded:
            return dict(valid=False, status="invalid", message="Invalid QR code signature or corrupted token")
        bk = d.query(Booking).filter_by(ref=decoded["ref"]).first()
    elif b.ref:
        bk = d.query(Booking).filter_by(ref=b.ref.strip().upper()).first()

    if not bk:
        return dict(valid=False, status="not_found", message="Booking not found in registry")

    if bk.status == "cancelled":
        return dict(valid=False, status="cancelled", booking=booking_payload(bk), message="Ticket was CANCELLED & REFUNDED - Deny Entry")

    if bk.status == "checked_in":
        return dict(
            valid=False,
            status="already_used",
            booking=booking_payload(bk),
            message=f"ALREADY CHECKED IN at {bk.checked_in_at.strftime('%H:%M:%S') if bk.checked_in_at else 'earlier'} - Deny Entry"
        )

    # Valid entry: mark checked in
    bk.status = "checked_in"
    bk.checked_in_at = datetime.utcnow()
    d.commit()
    return dict(
        valid=True,
        status="valid",
        booking=booking_payload(bk),
        message=f"Entry Granted! Welcome to {bk.show.theatre.name}."
    )

# ==================== WEBSOCKET ====================

@app.websocket("/ws/shows/{sid}")
async def ws_endpoint(w: WebSocket, sid: int):
    await w.accept()
    rooms.setdefault(sid, set()).add(w)
    try:
        while True:
            await w.receive_text()
    except WebSocketDisconnect:
        rooms.get(sid, set()).discard(w)

# ==================== ADMIN DASHBOARD ====================

@app.get("/api/admin/dashboard")
def get_admin_dashboard(_=Depends(admin), d=Depends(db)):
    all_bookings = d.query(Booking).all()
    confirmed = [b for b in all_bookings if b.status in ("confirmed", "checked_in")]

    rev = sum(b.total for b in confirmed)
    tickets_count = sum(len(b.seats) for b in confirmed)

    # Calculate overall seat occupancy
    all_shows = d.query(Show).all()
    total_capacity = sum(len(build_seats(s.theatre.layout)) for s in all_shows) if all_shows else 1
    occupancy_pct = round((tickets_count / max(total_capacity, 1)) * 100, 1)

    # Bookings per movie
    movie_stats = {}
    for b in confirmed:
        m_title = b.show.movie.title
        movie_stats[m_title] = movie_stats.get(m_title, 0) + len(b.seats)

    bookings_per_movie = [{"movie": k, "seats": v} for k, v in movie_stats.items()]

    # Revenue per day (last 7 days)
    daily_rev = {}
    for i in range(7):
        day_str = (datetime.utcnow() - timedelta(days=6 - i)).strftime("%d %b")
        daily_rev[day_str] = 0

    for b in confirmed:
        day_str = b.created.strftime("%d %b")
        if day_str in daily_rev:
            daily_rev[day_str] += b.total
        else:
            daily_rev[day_str] = b.total

    revenue_trend = [{"date": k, "revenue": round(v)} for k, v in daily_rev.items()]

    # Top theatres
    theatre_rev = {}
    for b in confirmed:
        t_name = b.show.theatre.name
        theatre_rev[t_name] = theatre_rev.get(t_name, 0) + b.total

    top_theatres = [{"theatre": k, "revenue": round(v)} for k, v in sorted(theatre_rev.items(), key=lambda x: -x[1])[:5]]

    return dict(
        kpi=dict(
            revenue=round(rev),
            tickets=tickets_count,
            occupancy=occupancy_pct,
            bookings_count=len(confirmed)
        ),
        revenue_trend=revenue_trend,
        bookings_per_movie=bookings_per_movie,
        top_theatres=top_theatres
    )

# Admin Movie CRUD
class AdminMovieIn(BaseModel):
    title: str
    genre: str
    genres: list[str] = Field(default_factory=list)
    language: str = "English"
    languages: list[str] = Field(default_factory=list)
    minutes: int = 120
    rating: float = 8.5
    certificate: str = "UA 16+"
    director: str = ""
    cast: list[str] = Field(default_factory=list)
    formats: list[str] = Field(default_factory=list)
    synopsis: str = ""
    poster_url: str = ""
    backdrop_url: str = ""
    trailer_url: str = ""
    c1: str = "#0f172a"
    c2: str = "#4f7cff"

@app.post("/api/admin/movies")
def add_movie(b: AdminMovieIn, _=Depends(admin), d=Depends(db)):
    m = Movie(**b.model_dump())
    d.add(m)
    d.commit()
    return movie_payload(m)

@app.put("/api/admin/movies/{mid}")
def edit_movie(mid: int, b: AdminMovieIn, _=Depends(admin), d=Depends(db)):
    m = d.get(Movie, mid)
    if not m: raise HTTPException(404, "Movie not found")
    for k, v in b.model_dump().items():
        setattr(m, k, v)
    d.commit()
    return movie_payload(m)

@app.delete("/api/admin/movies/{mid}")
def delete_movie(mid: int, _=Depends(admin), d=Depends(db)):
    m = d.get(Movie, mid)
    if not m: raise HTTPException(404, "Movie not found")
    d.delete(m)
    d.commit()
    return dict(success=True)

# Admin Theatre CRUD
class AdminTheatreIn(BaseModel):
    name: str
    city: str
    amenities: list[str] = Field(default_factory=list)
    formats_supported: list[str] = Field(default_factory=list)
    layout: dict

@app.post("/api/admin/theatres")
def add_theatre(b: AdminTheatreIn, _=Depends(admin), d=Depends(db)):
    build_seats(b.layout)
    t = Theatre(
        name=b.name,
        city=b.city,
        layout=b.layout,
        amenities=b.amenities,
        formats_supported=b.formats_supported
    )
    d.add(t)
    d.commit()
    return dict(id=t.id)

@app.put("/api/admin/theatres/{tid}")
def update_theatre(tid: int, b: AdminTheatreIn, _=Depends(admin), d=Depends(db)):
    t = d.get(Theatre, tid)
    if not t: raise HTTPException(404, "Theatre not found")
    build_seats(b.layout)
    t.name = b.name
    t.city = b.city
    t.layout = b.layout
    t.amenities = b.amenities
    t.formats_supported = b.formats_supported
    d.commit()
    return dict(id=t.id)

# Admin Show CRUD
class AdminShowIn(BaseModel):
    movie_id: int
    theatre_id: int
    start: datetime
    price: float
    format: str = "2D"
    language: str = "English"

@app.post("/api/admin/shows")
def add_show(b: AdminShowIn, _=Depends(admin), d=Depends(db)):
    s = Show(**b.model_dump())
    d.add(s)
    d.commit()
    return dict(id=s.id)

@app.delete("/api/admin/shows/{sid}")
def delete_show(sid: int, _=Depends(admin), d=Depends(db)):
    s = d.get(Show, sid)
    if not s: raise HTTPException(404, "Show not found")
    d.delete(s)
    d.commit()
    return dict(success=True)

# ==================== SEED DATA ====================

def lay(spec, W, H, bot, front, aisles, rake=0.32):
    rows = [dict(label=string.ascii_uppercase[i], seats=n, tier=t) for i, (n, t) in enumerate(spec)]
    return dict(screen=dict(width=W, height=H, bottom=bot), front=front, aisles=aisles, rake=rake, rows=rows)

def seed():
    with engine.connect() as conn:
        from sqlalchemy import inspect
        inspector = inspect(conn)
        if "movies" in inspector.get_table_names():
            cols = [c["name"] for c in inspector.get_columns("movies")]
            if "genres" not in cols:
                Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with Session() as d:
        if d.query(Movie).count() >= 8:
            return

        # Seed Users
        d.add_all([
            User(name="Demo User", email="user@cine.dev", pw=hp("demo123"), role="user"),
            User(name="Demo Admin", email="admin@cine.dev", pw=hp("demo123"), role="admin"),
            User(name="Staff Scanner", email="staff@cine.dev", pw=hp("demo123"), role="staff"),
            User(name="Demo", email="demo@cine.dev", pw=hp("demo123"), role="user")
        ])

        # Seed Food Items
        d.add_all([
            FoodItem(name="Mega Tub Butter Popcorn", category="Popcorn", price=320, image_url="🍿", description="Freshly popped jumbo corn tossed in melted golden butter."),
            FoodItem(name="Artisan Caramel Popcorn", category="Popcorn", price=360, image_url="🍿", description="Crunchy kernels coated in rich artisanal salted caramel."),
            FoodItem(name="Loaded Nachos Grande", category="Snacks", price=290, image_url="🧀", description="Crispy corn chips with warm jalapeño cheese dip and spicy salsa."),
            FoodItem(name="Blockbuster Duo Combo", category="Combos", price=550, image_url="🥤", description="1 Large Popcorn + 2 Large Fountain Drinks + 1 Choco Bar."),
            FoodItem(name="Crispy Chicken Burger Sliders", category="Snacks", price=340, image_url="🍔", description="Three gourmet brioche mini burgers with herb garlic mayo."),
            FoodItem(name="Cold Brew Nitro Coffee", category="Beverages", price=220, image_url="☕", description="Smooth single-origin slow cold brew infused with nitrogen."),
            FoodItem(name="Chilled Sparkling Mojito", category="Beverages", price=190, image_url="🍹", description="Refreshing lime and wild mint cooler with crushed ice.")
        ])

        # Seed Promo Codes
        d.add_all([
            PromoCode(code="WELCOME50", discount_type="percent", discount_val=50, min_order=300, max_discount=150, active=True),
            PromoCode(code="CINE20", discount_type="percent", discount_val=20, min_order=200, max_discount=100, active=True),
            PromoCode(code="IMAX100", discount_type="flat", discount_val=100, min_order=500, max_discount=100, active=True)
        ])

        # Seed Movies (8+ realistic titles with posters, backdrops, cast, genres)
        ms = [
            Movie(
                title="Dune: Part Two",
                genre="Sci-Fi",
                genres=["Sci-Fi", "Adventure", "IMAX Experience"],
                language="English",
                languages=["English", "Hindi"],
                minutes=166,
                rating=8.8,
                certificate="UA 16+",
                director="Denis Villeneuve",
                cast=["Timothée Chalamet", "Zendaya", "Rebecca Ferguson", "Javier Bardem", "Austin Butler"],
                formats=["IMAX 3D", "3D", "2D"],
                synopsis="Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between love and the fate of the universe, he endeavours to prevent a terrible future.",
                poster_url="https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
                backdrop_url="https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5200bm.jpg",
                trailer_url="https://www.youtube.com/watch?v=Way9Dexny3w",
                c1="#1e1b4b", c2="#ea580c"
            ),
            Movie(
                title="Oppenheimer",
                genre="Drama",
                genres=["Biography", "Drama", "History"],
                language="English",
                languages=["English", "Hindi"],
                minutes=180,
                rating=8.9,
                certificate="A",
                director="Christopher Nolan",
                cast=["Cillian Murphy", "Emily Blunt", "Matt Damon", "Robert Downey Jr.", "Florence Pugh"],
                formats=["IMAX 70mm", "2D"],
                synopsis="The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II, unravelling the moral and political aftermath.",
                poster_url="https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
                backdrop_url="https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
                trailer_url="https://www.youtube.com/watch?v=uYPbbksJxIg",
                c1="#451a03", c2="#f59e0b"
            ),
            Movie(
                title="Cyberpunk: Edge of Neon",
                genre="Cyberpunk",
                genres=["Cyberpunk", "Action", "Sci-Fi"],
                language="English",
                languages=["English", "Japanese"],
                minutes=128,
                rating=8.6,
                certificate="A",
                director="Hiroyuki Imaishi",
                cast=["Aoi Yuuki", "KENN", "Hiroki Touchi", "Michiko Kaiden"],
                formats=["3D", "2D"],
                synopsis="In a dystopian megalopolis obsessed with high technology and body modification, a street courier takes on an impossible mercenary mission that threatens to detonate the entire city matrix.",
                poster_url="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80",
                backdrop_url="https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80",
                trailer_url="https://www.youtube.com/watch?v=JtqIas3bYhg",
                c1="#581c87", c2="#06b6d4"
            ),
            Movie(
                title="Interstellar: 10th Anniversary",
                genre="Sci-Fi",
                genres=["Sci-Fi", "Adventure", "IMAX Experience"],
                language="English",
                languages=["English"],
                minutes=169,
                rating=8.9,
                certificate="UA",
                director="Christopher Nolan",
                cast=["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain", "Michael Caine"],
                formats=["IMAX 3D", "2D"],
                synopsis="When Earth becomes uninhabitable in the near future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked with piloting a spacecraft along with a team of researchers through a newly discovered wormhole.",
                poster_url="https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
                backdrop_url="https://image.tmdb.org/t/p/original/rAiYTsqJJR0KP8UN8vCnZ9v9ZDx.jpg",
                trailer_url="https://www.youtube.com/watch?v=zSWdZVtXT7E",
                c1="#022c22", c2="#3b82f6"
            ),
            Movie(
                title="Spider-Man: Across the Spider-Verse",
                genre="Action",
                genres=["Animation", "Action", "Adventure"],
                language="English",
                languages=["English", "Hindi", "Tamil"],
                minutes=140,
                rating=8.7,
                certificate="U",
                director="Joaquim Dos Santos",
                cast=["Shameik Moore", "Hailee Steinfeld", "Oscar Isaac", "Daniel Kaluuya"],
                formats=["3D", "2D", "IMAX 3D"],
                synopsis="Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence. When the heroes clash on how to handle a threat, Miles must redefine what it means to be a hero.",
                poster_url="https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
                backdrop_url="https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg",
                trailer_url="https://www.youtube.com/watch?v=cqGjhVJWtEg",
                c1="#831843", c2="#38bdf8"
            ),
            Movie(
                title="Planet Earth III: Ocean Abyss",
                genre="Nature",
                genres=["Documentary", "Nature", "IMAX Experience"],
                language="English",
                languages=["English", "Hindi"],
                minutes=110,
                rating=9.1,
                certificate="U",
                director="Alastair Fothergill",
                cast=["David Attenborough"],
                formats=["IMAX 3D", "2D"],
                synopsis="Experience the deepest ocean trenches and coral kingdoms in pristine 3D IMAX fidelity, journeying into the most remote marine sanctuaries on Earth with groundbreaking deep-submersible photography.",
                poster_url="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80",
                backdrop_url="https://images.unsplash.com/photo-1682687220063-4742bd7fd538?auto=format&fit=crop&w=1600&q=80",
                trailer_url="https://www.youtube.com/watch?v=2eP3d1XoNmg",
                c1="#064e3b", c2="#14b8a6"
            ),
            Movie(
                title="The Quantum Heist",
                genre="Action",
                genres=["Action", "Thriller", "Sci-Fi"],
                language="English",
                languages=["English", "Hindi"],
                minutes=122,
                rating=8.2,
                certificate="UA 16+",
                director="Karyn Kusama",
                cast=["Dev Patel", "Ana de Armas", "Karl Urban", "Hiroyuki Sanada"],
                formats=["2D", "3D"],
                synopsis="A mastermind extraction crew infiltrates an underground quantum cryptography facility to steal a 60-second time loop - and discovers they have already executed the robbery forty-two times.",
                poster_url="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
                backdrop_url="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1600&q=80",
                trailer_url="https://www.youtube.com/watch?v=Way9Dexny3w",
                c1="#4c0519", c2="#fb923c"
            ),
            Movie(
                title="Wild Serengeti: Kingdom of Light",
                genre="Nature",
                genres=["Documentary", "Nature"],
                language="English",
                languages=["English", "Hindi", "Tamil"],
                minutes=95,
                rating=8.8,
                certificate="U",
                director="Mark Linfield",
                cast=["Lupita Nyong'o"],
                formats=["2D", "IMAX 3D"],
                synopsis="Witness the grand annual migration across the African plains filmed over four years with ultra-high-speed and thermal cameras, capturing untold predator-prey dynamics under the equatorial sky.",
                poster_url="https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=600&q=80",
                backdrop_url="https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1600&q=80",
                trailer_url="https://www.youtube.com/watch?v=2eP3d1XoNmg",
                c1="#713f12", c2="#eab308"
            )
        ]

        # Seed Theatres across major cities
        ths = [
            Theatre(
                name="Aurora IMAX Laser Experience",
                city="Chennai",
                amenities=["IMAX with Laser", "Dolby Atmos 128 Channel", "Plush Pushback Chairs", "Gourmet F&B Delivery", "Wheelchair Accessible"],
                formats_supported=["IMAX 3D", "3D", "2D"],
                cancellation_available=True,
                layout=lay([(14, "Normal")] * 3 + [(14, "Executive")] * 4 + [(14, "Premium")] * 3, 16, 7.2, 1.6, 5.5, [4, 10])
            ),
            Theatre(
                name="Starlight Grand Luxe Cinema",
                city="Bengaluru",
                amenities=["4K Dual RGB Laser", "VIP Luxury Recliners", "In-Seat Dining Service", "Dolby Atmos Sound", "Valet Parking"],
                formats_supported=["IMAX 3D", "3D", "2D"],
                cancellation_available=True,
                layout=lay([(18, "Normal")] * 4 + [(18, "Executive")] * 5 + [(18, "Premium")] * 3, 20, 9.2, 1.8, 7.0, [5, 13], 0.35)
            ),
            Theatre(
                name="The Velvet Lounge & Barco Escape",
                city="Hyderabad",
                amenities=["Private Pod Seating", "Dolby Atmos", "Signature Cocktail Bar", "Heated Recliners", "Personal Butler"],
                formats_supported=["3D", "2D"],
                cancellation_available=True,
                layout=lay([(10, "Premium")] * 6, 11, 4.8, 1.4, 4.0, [5], 0.38)
            ),
            Theatre(
                name="PVR INOX Regal Superplex",
                city="Mumbai",
                amenities=["IMAX with Laser", "4DX Motion Simulator", "Dolby Atmos Sound", "Star Lounge Access", "Live Kitchen"],
                formats_supported=["IMAX 3D", "3D", "2D"],
                cancellation_available=True,
                layout=lay([(16, "Normal")] * 4 + [(16, "Executive")] * 4 + [(16, "Premium")] * 4, 18, 8.0, 1.7, 6.2, [4, 12], 0.33)
            )
        ]

        d.add_all(ms + ths)
        d.flush()

        now = datetime.utcnow()
        # Create shows for next 7 days across morning, afternoon, evening, night
        show_times = [(10, 30), (14, 0), (17, 30), (20, 45)]
        formats_pool = ["IMAX 3D", "3D", "2D"]

        for m_idx, m in enumerate(ms):
            for t_idx, t in enumerate(ths):
                for day in range(7):
                    for h_idx, (hr, mn) in enumerate(show_times):
                        fmt_choice = formats_pool[(m_idx + t_idx + day + h_idx) % len(formats_pool)]
                        if fmt_choice not in (t.formats_supported or ["2D"]):
                            fmt_choice = "2D"
                        base_price = 450 if "IMAX" in fmt_choice else 320 if "Velvet" in t.name else 240
                        show_start = (now + timedelta(days=day)).replace(hour=hr, minute=mn, second=0, microsecond=0)
                        d.add(Show(
                            movie_id=m.id,
                            theatre_id=t.id,
                            start=show_start,
                            price=base_price,
                            format=fmt_choice,
                            language=m.language
                        ))
        d.commit()

seed()
