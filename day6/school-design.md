# School Database Design

This database models a simple school enrolment system using three tables: `students`, `courses` and `enrolments`.

## Students Table

The `students` table stores information about each student.

It contains:

- `id` - the unique primary key for each student.
- `name` - the student's name.
- `email` - the student's email address.

The email column is marked as `UNIQUE` so two students cannot be registered with the same email address.

## Courses Table

The `courses` table stores the courses available in the school.

It contains:

- `id` - the unique primary key for each course.
- `title` - the name of the course.
- `code` - a unique course code such as `WEB101`.

The course code is unique so that the same course code cannot be assigned to multiple courses.

## Enrolments Table

The `enrolments` table records which students are enrolled in which courses.

It contains:

- `id` - the primary key for the enrolment.
- `student_id` - a foreign key referencing the student.
- `course_id` - a foreign key referencing the course.
- `grade` - the student's grade for that course.

A unique constraint is placed on the combination of `student_id` and `course_id`. This prevents the same student from being enrolled in the same course more than once.

## Relationships

A student can have many enrolment records, so the relationship between `students` and `enrolments` is one-to-many.

A course can also have many enrolment records, so the relationship between `courses` and `enrolments` is one-to-many.

Students and courses therefore have a many-to-many relationship. One student can enrol in many courses, and one course can have many students.

A join table is required because a direct foreign key on either `students` or `courses` would not properly represent this many-to-many relationship. The `enrolments` table connects students and courses and also stores information about the relationship itself, such as the student's grade.

## Index

One useful index would be:

```sql
CREATE INDEX idx_enrolments_course_id
ON enrolments(course_id);
