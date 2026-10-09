PRAGMA foreign_keys = ON;

-- =========================
-- CREATE TABLES
-- =========================

CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

CREATE TABLE courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE
);

CREATE TABLE enrolments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE (student_id, course_id)
);

-- =========================
-- INSERT SAMPLE DATA
-- =========================

INSERT INTO students (name, email)
VALUES
    ('Michael Olayenikan', 'michael@example.com'),
    ('Grace Johnson', 'grace@example.com'),
    ('David Adeyemi', 'david@example.com'),
    ('Sarah Bello', 'sarah@example.com');

INSERT INTO courses (title, code)
VALUES
    ('Web Development', 'WEB101'),
    ('Database Fundamentals', 'DBS101'),
    ('JavaScript Programming', 'JS101');

INSERT INTO enrolments (student_id, course_id, grade)
VALUES
    (1, 1, 'A'),
    (1, 2, 'B'),
    (2, 1, 'B'),
    (2, 3, 'A'),
    (3, 2, 'C');

-- =========================
-- QUERY 1
-- All courses for one student by name
-- =========================

SELECT
    students.name AS student_name,
    courses.title AS course_title,
    courses.code AS course_code,
    enrolments.grade
FROM enrolments
JOIN students
    ON enrolments.student_id = students.id
JOIN courses
    ON enrolments.course_id = courses.id
WHERE students.name = 'Michael Olayenikan';

-- =========================
-- QUERY 2
-- All students on one course
-- =========================

SELECT
    courses.title AS course_title,
    students.name AS student_name,
    students.email,
    enrolments.grade
FROM enrolments
JOIN students
    ON enrolments.student_id = students.id
JOIN courses
    ON enrolments.course_id = courses.id
WHERE courses.title = 'Web Development';

-- =========================
-- QUERY 3
-- Number of students per course
-- =========================

SELECT
    courses.id,
    courses.title,
    courses.code,
    COUNT(enrolments.student_id) AS number_of_students
FROM courses
LEFT JOIN enrolments
    ON courses.id = enrolments.course_id
GROUP BY
    courses.id,
    courses.title,
    courses.code
ORDER BY courses.id;

-- =========================
-- QUERY 4
-- Students who have no enrolments
-- =========================

SELECT
    students.id,
    students.name,
    students.email
FROM students
LEFT JOIN enrolments
    ON students.id = enrolments.student_id
WHERE enrolments.id IS NULL;

-- =========================
-- QUERY 5
-- Update one enrolment's grade
-- =========================

UPDATE enrolments
SET grade = 'A'
WHERE student_id = 3
  AND course_id = 2;

-- Check the updated enrolment
SELECT
    students.name AS student_name,
    courses.title AS course_title,
    enrolments.grade
FROM enrolments
JOIN students
    ON enrolments.student_id = students.id
JOIN courses
    ON enrolments.course_id = courses.id
WHERE enrolments.student_id = 3
  AND enrolments.course_id = 2;
