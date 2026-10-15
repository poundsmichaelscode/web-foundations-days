# TicketHub System Design

## Overview

TicketHub is an online ticketing platform where users can browse concerts and events, view available seats, temporarily hold seats, pay for tickets, and view purchased tickets.

The main challenge is handling normal daily traffic while also surviving extremely high traffic when a popular concert goes on sale. The system must also guarantee that the same seat cannot be sold to two different people.

---

# 1. Requirements

## Functional Requirements

TicketHub should allow users to:

- Register and sign in.
- Browse available events.
- Search events by name, location, date, or category.
- View event details.
- View available and unavailable seats.
- Select one or more seats.
- Temporarily hold seats while completing payment.
- Pay for held seats.
- Receive confirmation after successful payment.
- View purchased tickets.
- Cancel expired seat holds automatically.
- Allow administrators to create and manage events.

## Non-Functional Requirements

### Performance

Event pages and seat maps should load quickly during both normal traffic and large ticket releases.

### Correctness

The system must never sell the same seat to two customers.

### Fairness

When a popular event goes on sale, users should have a fair opportunity to buy available seats instead of allowing one user or bot to reserve a large number of seats unfairly.

### Availability

TicketHub should remain available even when traffic suddenly increases.

### Scalability

The architecture should support adding more application servers when traffic grows.

### Security

Payments and user information must be protected using HTTPS, secure authentication, encryption, and proper authorization.

### Reliability

Orders and payment records must not be lost even if a server fails.

### Observability

The system should record logs and metrics for failures, payment problems, slow requests, and unusual traffic.

---

# 2. Traffic Estimates

## Starting Facts

TicketHub has:

- 2,000,000 registered users.
- 50,000 visitors on a normal day.
- Each normal visitor views 10 pages.
- 5,000 tickets are sold on a normal day.
- During a major concert sale, 200,000 people attempt to buy 20,000 seats within 10 minutes.

A day contains 86,400 seconds.

---

## Normal Traffic

### Daily Page Views

```text
50,000 visitors × 10 pages
= 500,000 page views per day
```

### Average Normal Page Views Per Second

```text
500,000 ÷ 86,400
≈ 5.8 requests per second
```

The average browsing load is therefore approximately:

**6 page views per second**

Real traffic will not be perfectly even, so the system should be designed for a significantly higher normal peak.

For example, using a 5× peak assumption:

```text
5.8 × 5
≈ 29 requests per second
```

A reasonable estimated normal peak is approximately:

**29 page views per second**

---

## Normal Ticket Purchases

TicketHub sells:

```text
5,000 tickets per day
```

Average purchases per second:

```text
5,000 ÷ 86,400
≈ 0.058
```

This is approximately:

**1 ticket purchase every 17 seconds on average**

Normal payment traffic is therefore relatively small compared with browsing traffic.

---

# 3. Big Sale Traffic

A popular concert receives:

```text
200,000 buyers in 10 minutes
```

Ten minutes contains:

```text
10 × 60
= 600 seconds
```

Average purchase-attempt rate during the sale:

```text
200,000 ÷ 600
≈ 333.3
```

TicketHub therefore receives approximately:

**333 purchase attempts per second**

This is only the number of users attempting to buy.

Each customer may generate several requests, including:

- event page request
- seat-map request
- seat availability refresh
- hold request
- payment request
- order-status request

If each customer generates approximately five important requests during the purchase process:

```text
333 × 5
≈ 1,665 requests per second
```

The application could therefore experience roughly:

**1,600–1,700 application requests per second during the big sale**

There may also be even larger traffic bursts at the exact moment tickets become available.

---

# 4. Normal vs Big Sale Comparison

Normal browsing traffic is approximately:

```text
6 requests/second average
29 requests/second estimated peak
```

A major concert could generate:

```text
333 purchase attempts/second
1,600+ application requests/second
```

The large concert sale is therefore dramatically more demanding than normal traffic.

The architecture must be designed around the peak event rather than just the normal daily average.

---

# 5. API Design

Base API:

```text
/api/v1
```

## Endpoint 1 - Browse Events

### `GET /api/v1/events`

Returns available events.

Example:

```http
GET /api/v1/events?city=Lagos&date=2026-12-20
```

Success:

```text
200 OK
```

---

## Endpoint 2 - View One Event

### `GET /api/v1/events/{eventId}`

Returns information about one event.

Example:

```http
GET /api/v1/events/500
```

Success:

```text
200 OK
```

---

## Endpoint 3 - View Available Seats

### `GET /api/v1/events/{eventId}/seats`

Returns the seat map and current seat availability.

Example:

```http
GET /api/v1/events/500/seats
```

Success:

```text
200 OK
```

Example response:

```json
{
  "eventId": 500,
  "seats": [
    {
      "id": 10001,
      "section": "A",
      "row": "4",
      "number": "15",
      "status": "available",
      "price": 25000
    }
  ]
}
```

---

## Endpoint 4 - Hold Seats

### `POST /api/v1/events/{eventId}/holds`

Temporarily reserves seats for a customer.

Request:

```json
{
  "seatIds": [10001, 10002]
}
```

Success:

```text
201 Created
```

Example response:

```json
{
  "holdId": "hold_abc123",
  "seatIds": [10001, 10002],
  "expiresAt": "2026-12-20T10:05:00Z"
}
```

The hold might remain valid for approximately five minutes.

---

## Endpoint 5 - Pay for Held Seats

### `POST /api/v1/orders`

Creates an order and starts payment for a valid seat hold.

Request:

```json
{
  "holdId": "hold_abc123",
  "paymentMethod": "card"
}
```

Success:

```text
201 Created
```

Example response:

```json
{
  "orderId": 90001,
  "status": "payment_pending",
  "amount": 50000
}
```

---

## Endpoint 6 - Confirm Payment

### `POST /api/v1/orders/{orderId}/payment-confirmation`

Processes or records successful payment confirmation.

Success:

```text
200 OK
```

Example response:

```json
{
  "orderId": 90001,
  "status": "paid"
}
```

---

## Endpoint 7 - View My Tickets

### `GET /api/v1/me/tickets`

Returns tickets owned by the authenticated customer.

Success:

```text
200 OK
```

---

# 6. Data Model

The main tables are:

- `users`
- `events`
- `seats`
- `orders`

Additional tables such as `seat_holds`, `order_items`, and `tickets` are required for a complete system.

---

## Users Table

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

A user can create many orders.

---

## Events Table

```sql
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    venue VARCHAR(200) NOT NULL,
    event_date TIMESTAMPTZ NOT NULL,
    sale_start TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

One event has many seats.

---

## Seats Table

```sql
CREATE TABLE seats (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id),
    section VARCHAR(50) NOT NULL,
    row_number VARCHAR(20) NOT NULL,
    seat_number VARCHAR(20) NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    UNIQUE (event_id, section, row_number, seat_number)
);
```

The unique constraint ensures the same physical seat cannot exist twice for one event.

---

## Seat Holds Table

```sql
CREATE TABLE seat_holds (
    id UUID PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    event_id BIGINT NOT NULL REFERENCES events(id),
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Held Seats Table

```sql
CREATE TABLE held_seats (
    hold_id UUID NOT NULL REFERENCES seat_holds(id) ON DELETE CASCADE,
    seat_id BIGINT NOT NULL REFERENCES seats(id),
    PRIMARY KEY (hold_id, seat_id),
    UNIQUE (seat_id)
);
```

The `UNIQUE (seat_id)` constraint prevents the same seat from being part of two active holds at the database level.

In production, expired holds would be removed or marked expired before the seat becomes available again.

---

## Orders Table

```sql
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    event_id BIGINT NOT NULL REFERENCES events(id),
    status VARCHAR(30) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Order Items Table

```sql
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    seat_id BIGINT NOT NULL REFERENCES seats(id),
    price DECIMAL(12, 2) NOT NULL,
    UNIQUE (seat_id)
);
```

The unique seat constraint provides another layer of protection against selling the same seat twice.

---

# 7. Relationships

The main relationships are:

```text
User
 |
 | one-to-many
 v
Orders

Event
 |
 | one-to-many
 v
Seats

Event
 |
 | one-to-many
 v
Orders

SeatHold
 |
 | one-to-many
 v
HeldSeats

Order
 |
 | one-to-many
 v
OrderItems

Seat
 |
 | can belong to only one successful order
 v
OrderItem
```

A user can place many orders.

An event contains many seats.

An order may contain multiple ticketed seats.

---

# 8. Preventing Double Booking

Preventing two people from buying the same seat is one of the most important requirements.

The system should not rely only on what the browser displays because two users may see the same seat as available at almost exactly the same moment.

The final decision must happen in the backend database.

## Seat Hold Transaction

When a customer selects a seat, the application starts a database transaction.

Example approach:

```sql
BEGIN;

SELECT id, status
FROM seats
WHERE id = 10001
FOR UPDATE;
```

`FOR UPDATE` locks the seat row for the duration of the transaction.

The application then checks whether the seat is still available.

If available, a hold is created and the seat becomes temporarily unavailable.

```sql
UPDATE seats
SET status = 'held'
WHERE id = 10001
  AND status = 'available';
```

The transaction then commits.

```sql
COMMIT;
```

If another user tries to hold the same seat at the same time, their transaction must wait.

When the first transaction completes, the second request discovers that the seat is no longer available and fails.

---

## Database Constraints

The system should also use database uniqueness constraints such as:

```sql
UNIQUE (seat_id)
```

on active held-seat or purchased-seat records.

This means that even if an application bug causes two requests to reach the database simultaneously, the database still prevents two successful records for the same seat.

---

## Hold Expiration

A seat hold should have a short expiration time, for example:

```text
5 minutes
```

If the customer does not complete payment within that period, a worker marks the hold as expired and makes the seats available again.

This prevents users from holding tickets indefinitely.

---

## Payment and Final Purchase

After successful payment, another transaction converts the held seats into purchased seats.

The transaction should verify that:

- the hold exists
- the hold belongs to the customer
- the hold has not expired
- the seats are still associated with that hold
- payment succeeded

Only then are the seats marked as sold.

This combination of:

- row locking
- transactions
- conditional updates
- unique constraints
- short-lived seat holds

prevents double booking.

---

# 9. Architecture

```text
                          +------------------+
                          |      Users       |
                          +------------------+
                                   |
                                   v
                          +------------------+
                          |       CDN        |
                          +------------------+
                                   |
                                   v
                          +------------------+
                          | Load Balancer    |
                          +------------------+
                          /        |        \
                         /         |         \
                        v          v          v
                 +----------+ +----------+ +----------+
                 | App      | | App      | | App      |
                 | Server 1 | | Server 2 | | Server 3 |
                 +----------+ +----------+ +----------+
                        \        |        /
                         \       |       /
                          +------+------+
                                 |
                    +------------+------------+
                    |                         |
                    v                         v
              +-----------+           +--------------+
              |   Redis   |           | Primary DB   |
              |   Cache   |           | PostgreSQL   |
              +-----------+           +--------------+
                                            |
                                            v
                                    +---------------+
                                    | Read Replica  |
                                    +---------------+

                         App Servers
                              |
                  +-----------+-----------+
                  |                       |
                  v                       v
             +----------+           +----------+
             |  Queue   |           | Payment  |
             +----------+           | Provider |
                  |                 +----------+
                  v
             +----------+
             | Workers  |
             +----------+
                  |
                  v
          Expire seat holds /
          send tickets /
          process background jobs

                +-------------------------+
                | Monitoring and Logging  |
                +-------------------------+
```

---

# 10. Component Explanations

## CDN

The CDN serves static assets close to users so the application servers do not have to handle every CSS, JavaScript, and image request.

## Load Balancer

The load balancer distributes incoming requests across many application servers.

## Application Servers

Application servers handle authentication, events, seat availability, holds, orders, and payment workflows.

## Redis Cache

Redis stores frequently requested event information and can also support fast temporary data such as rate limits and queue-position information.

## Primary Database

The primary PostgreSQL database is the authoritative source for seat availability, holds, orders, and tickets.

## Read Replica

The read replica handles non-critical read queries such as event browsing without increasing load on the primary database.

## Queue

The queue buffers asynchronous tasks so expensive work does not delay the main ticket purchase flow.

## Workers

Workers process tasks such as expiring seat holds, sending confirmation emails, and generating ticket records.

## Payment Provider

The payment provider securely handles card or other payment transactions rather than storing sensitive payment details directly inside TicketHub.

## Monitoring and Logging

Monitoring systems track traffic, errors, latency, failed payments, queue depth, and database health.

---

# 11. Surviving the Big Sale

During the major concert release, 200,000 customers may arrive within ten minutes.

The system should use several techniques.

## Horizontal Scaling

More application servers can be started behind the load balancer before the sale begins.

## CDN

Static event assets should be served through the CDN so they do not consume application capacity.

## Caching

Event descriptions, venue information, and other non-seat-specific information can be heavily cached.

Seat availability must be treated more carefully because it changes rapidly.

## Waiting Room

For extremely popular events, TicketHub can introduce a virtual waiting room.

Instead of allowing all 200,000 users to attempt database transactions at once, a controlled number are admitted into the buying flow.

This protects the database and improves fairness.

## Queue-Based Background Work

Email delivery and other non-critical tasks should be moved to queues so they do not slow down purchases.

## Database Connection Pooling

Application servers should use controlled database connection pools so traffic spikes do not create unlimited database connections.

## Rate Limiting

Rate limiting prevents bots or individual users from repeatedly sending excessive hold requests.

---

# 12. Fairness

TicketHub should try to give customers a fair opportunity to buy tickets.

Possible fairness controls include:

- a virtual waiting room
- rate limiting
- maximum ticket quantities per user
- CAPTCHA or bot protection
- one active hold per seat
- short hold expiration
- queue tokens that cannot easily be reused
- limiting repeated refresh requests

Fairness is particularly important because there are:

```text
200,000 interested customers
20,000 available seats
```

Only:

```text
20,000 ÷ 200,000
= 10%
```

of the customers can possibly receive a seat.

---

# 13. Trade-Offs

## Trade-Off 1: Strong Consistency vs Maximum Speed

Seat purchases require strong correctness.

Using database transactions and row locks may make a seat request slightly slower, especially when many people attempt to buy the same seat.

However, allowing faster but eventually consistent seat purchases could result in double booking.

For TicketHub, correctness is more important than maximum speed during final seat allocation.

---

## Trade-Off 2: Waiting Room vs Immediate Access

A waiting room protects the database and improves fairness during major sales.

However, some users must wait before entering the purchase flow, which can feel slower.

The trade-off is worthwhile because allowing everyone into the checkout system simultaneously could cause outages.

---

## Trade-Off 3: Seat Holds vs Maximum Seat Availability

Temporary seat holds make checkout safer because customers have time to pay.

However, held seats cannot be purchased by other customers even if the holder eventually abandons checkout.

A short expiration time balances customer convenience with ticket availability.

---

## Trade-Off 4: Caching vs Fresh Seat Information

Caching improves system performance.

However, seat availability changes rapidly and stale cached information could show a seat as available even though another person has already held it.

TicketHub should therefore cache general event data aggressively but use the authoritative database for final seat reservation decisions.

---

# 14. Summary

TicketHub has:

- **2 million registered users**
- **50,000 normal daily visitors**
- **500,000 normal page views per day**
- **about 6 average page views per second**
- **about 29 requests per second at an estimated normal 5× peak**
- **5,000 normal ticket sales per day**
- **200,000 customers during a major 10-minute sale**
- **about 333 purchase attempts per second during that sale**
- **20,000 available seats for the major concert**

The system should use a CDN, load balancer, horizontally scaled application servers, Redis, PostgreSQL, read replicas, queues, background workers, rate limiting, and potentially a virtual waiting room.

Most importantly, TicketHub must prevent double booking using **database transactions, row-level locks, conditional updates, short-lived seat holds, and unique constraints** rather than trusting availability shown in the user's browser.
