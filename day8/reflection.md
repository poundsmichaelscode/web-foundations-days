# Course Reflection

The most difficult concept for me during this course was moving from thinking about individual web pages and features to thinking about how an entire application behaves at scale. Concepts such as load balancing, caching, database replicas, queues, transactions, and estimating traffic initially felt separate. I overcame this by breaking each system into smaller parts and asking what problem each component solves. The SnapShare and QuickNotes system-design exercises also helped me understand how traffic estimates influence architecture decisions.

One part of my capstone that I would improve is the depth of my failure handling and scalability planning. My initial focus was mainly on the normal request flow, but I now understand that a stronger design should also explain what happens when a database, cache, API server, or external service fails. I would add clearer high-availability strategies, monitoring, retry behaviour, rate limiting, and single-point-of-failure analysis.

Next, I want to deepen my knowledge of backend and DevOps engineering. I plan to learn more about PostgreSQL performance, Redis, message queues, Docker, Kubernetes, cloud infrastructure, Terraform, CI/CD, monitoring, and distributed-system design. I also want to build and deploy more real applications so I can connect these architecture concepts with practical implementation.
