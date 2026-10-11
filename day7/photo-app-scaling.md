# SnapShare Scaling Plan

## 1. Assumptions and Daily Active Users

SnapShare is a photo-sharing application where users upload photos and scroll through a feed of photos from people they follow.

Starting facts:

- 10,000,000 registered users
- 10% are active each day
- Each active user uploads 1 photo per day
- Each active user views 50 feed pages per day
- Average photo size: 2 MB
- Thumbnail size: 50 KB
- 86,400 seconds in one day
- Peak traffic is assumed to be 5 times the average traffic

### Daily Active Users

```text
10,000,000 × 10%
= 1,000,000 daily active users
```

SnapShare therefore has approximately **1 million daily active users**.

---

## 2. Traffic and Storage Calculations

### Uploads Per Day

Each active user uploads one photo per day:

```text
1,000,000 users × 1 upload
= 1,000,000 uploads per day
```

### Average Uploads Per Second

```text
1,000,000 ÷ 86,400
≈ 11.57
```

Average upload rate:

**Approximately 12 uploads per second**

### Peak Uploads Per Second

Using 5 times the average:

```text
11.57 × 5
≈ 57.85
```

Peak upload rate:

**Approximately 58 uploads per second**

---

### Feed Views Per Day

Each active user views 50 feed pages per day:

```text
1,000,000 × 50
= 50,000,000 feed views per day
```

### Average Feed Views Per Second

```text
50,000,000 ÷ 86,400
≈ 578.7
```

Average feed traffic:

**Approximately 579 feed views per second**

### Peak Feed Views Per Second

Using 5 times the average:

```text
578.7 × 5
≈ 2,893.5
```

Peak feed traffic:

**Approximately 2,894 feed views per second**

---

### Photo Storage Per Year

Each upload produces:

- Original photo = 2 MB
- Thumbnail = 50 KB, approximately 0.05 MB

Total per upload:

```text
2 MB + 0.05 MB
= 2.05 MB
```

Daily storage:

```text
1,000,000 × 2.05 MB
= 2,050,000 MB
≈ 2.05 TB per day
```

Yearly storage:

```text
2.05 TB × 365
= 748.25 TB per year
```

SnapShare therefore needs approximately:

**748 TB of new photo and thumbnail storage per year**

This does not include backups, replication, logs, database data, or other operational storage.

---

## 3. Read-Heavy or Write-Heavy?

SnapShare is a **read-heavy system**.

There are:

```text
1,000,000 uploads per day
50,000,000 feed views per day
```

This means there are roughly:

```text
50 feed views for every upload
```

Because reads greatly outnumber writes, the architecture should prioritize:

- caching
- CDN usage
- database read replicas
- efficient feed queries
- horizontally scalable application servers

The primary database should not have to handle every feed read directly.

---

## 4. Why Photos Should Not Be Stored in the Database

The actual photo files should not be stored directly inside the main relational database.

Photos are large binary files, and storing them in the database would:

- make the database grow extremely quickly
- increase backup size and recovery time
- make replication more expensive
- put unnecessary load on the database
- make it harder to serve images efficiently at global scale

Instead, photos should be stored in **object storage**, such as:

- Amazon S3
- Azure Blob Storage
- Google Cloud Storage

The database should only store photo metadata, such as:

```text
photo_id
user_id
photo_url
thumbnail_url
caption
created_at
```

The actual image files should live in object storage and be delivered through a CDN.

---

## 5. Architecture Diagram

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
                         |  Load Balancer   |
                         +------------------+
                           /       |       \
                          /        |        \
                         v         v         v
                 +-----------+ +-----------+ +-----------+
                 | App       | | App       | | App       |
                 | Server 1  | | Server 2  | | Server 3  |
                 +-----------+ +-----------+ +-----------+
                         \        |        /
                          \       |       /
                           +------+------+
                                  |
                   +--------------+--------------+
                   |                             |
                   v                             v
             +-----------+                +--------------+
             |   Cache   |                |   Primary    |
             |   Redis   |                |   Database   |
             +-----------+                +--------------+
                                                |
                                                v
                                         +--------------+
                                         | Read Replica |
                                         +--------------+

                   App Servers
                        |
              +---------+----------+
              |                    |
              v                    v
      +----------------+      +-----------+
      | Object Storage |      |   Queue   |
      | Original Photos|      +-----------+
      +----------------+            |
                                    v
                              +-------------+
                              | Thumbnail   |
                              | Worker      |
                              +-------------+
                                    |
                                    v
                            +----------------+
                            | Object Storage |
                            |   Thumbnails   |
                            +----------------+
```

---

## 6. Component Explanations

### CDN

The CDN caches and serves photos and thumbnails close to users, reducing latency and traffic to the main infrastructure.

### Load Balancer

The load balancer distributes incoming requests across multiple application servers so that no single server becomes overloaded.

### Application Servers

The application servers handle business logic such as authentication, feed requests, uploads, and API operations.

### Cache

The cache stores frequently requested data such as feed results so repeated requests do not always need to query the database.

### Primary Database

The primary database stores structured data such as users, posts, followers, photo metadata, and comments.

### Read Replica

The read replica handles read-heavy queries and reduces the workload on the primary database.

### Object Storage

Object storage stores the original photo files and generated thumbnails because it is designed to scale efficiently for large binary files.

### Queue

The queue holds background jobs such as thumbnail-generation tasks so image processing does not block the user's upload request.

### Thumbnail Worker

The thumbnail worker processes jobs from the queue and creates smaller thumbnail versions of uploaded images.

---

## 7. Photo Upload Flow

### Step 1: User selects a photo

The user selects a photo in the SnapShare app and submits it.

### Step 2: Request reaches the load balancer

The upload request reaches the load balancer, which forwards it to an available application server.

### Step 3: User is authenticated

The application server checks that the user is logged in and allowed to upload content.

### Step 4: Original photo is stored

The original photo is uploaded to object storage.

### Step 5: Metadata is saved

The application server stores a database record containing information such as:

```text
photo_id
user_id
photo_url
caption
created_at
```

### Step 6: Thumbnail job is queued

The application server places a thumbnail-generation job onto the queue.

Example:

```text
Generate thumbnail for photo 10245
```

### Step 7: Upload request completes

The user does not need to wait for the thumbnail to be generated, so the upload can return successfully.

### Step 8: Worker processes the job

A thumbnail worker reads the job from the queue and retrieves the original image.

### Step 9: Thumbnail is generated

The worker creates a smaller 50 KB thumbnail.

### Step 10: Thumbnail is stored

The generated thumbnail is saved to object storage.

### Step 11: Database is updated

The photo record is updated with the thumbnail URL.

### Step 12: CDN serves the images

When users view their feeds, photos and thumbnails are served through the CDN whenever possible.

---

## 8. Trade-Offs

### Trade-Off 1: Caching vs Freshness

Caching improves performance and reduces database load, but users may temporarily see slightly outdated feed data.

Reducing cache expiration time improves freshness but increases database traffic.

---

### Trade-Off 2: Asynchronous Thumbnail Processing vs Immediate Availability

Generating thumbnails through a queue makes uploads faster and prevents image processing from blocking the request.

However, there may be a short period when a photo exists but its thumbnail is not yet available.

---

### Trade-Off 3: Read Replicas vs Consistency

Read replicas improve scalability for read-heavy workloads.

However, replication can have a small delay, so a newly uploaded photo may not immediately appear in queries served by a replica.

---

### Trade-Off 4: CDN Performance vs Invalidation Complexity

A CDN greatly improves image delivery speed and reduces object-storage traffic.

However, deleting or replacing an image may require invalidating cached versions across different CDN locations.

---

## 9. Final Summary

SnapShare has approximately:

- **1,000,000 daily active users**
- **1,000,000 uploads per day**
- **12 average uploads per second**
- **58 peak uploads per second**
- **50,000,000 feed views per day**
- **579 average feed views per second**
- **2,894 peak feed views per second**
- **748 TB of new photo and thumbnail storage per year**

SnapShare is a **read-heavy system**, so the architecture should use a CDN, cache, load balancer, multiple application servers, database read replicas, object storage, and asynchronous background processing to scale efficiently.
