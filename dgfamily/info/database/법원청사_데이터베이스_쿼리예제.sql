
-- 대구법원청사관리시스템 주요 쿼리 예제

-- 1. 특정 부서의 모든 업무 조회
SELECT s.service_name as 업무명,
       s.required_documents as 필요서류,
       s.processing_time as 처리시간,
       s.service_fee as 수수료,
       sc.category_name as 분류
FROM services s
JOIN departments d ON s.dept_id = d.dept_id
JOIN service_categories sc ON s.category_id = sc.category_id
WHERE d.dept_name = '종합민원실'
ORDER BY s.service_name;

-- 2. 층별 이용 가능한 업무 조회
SELECT f.floor_number as 층,
       d.dept_name as 부서명,
       COUNT(s.service_id) as 업무개수
FROM floors f
JOIN departments d ON CAST(f.floor_number AS TEXT) IN (
    SELECT TRIM(value) FROM json_each('["' || REPLACE(d.floor_numbers, ',', '","') || '"]')
)
LEFT JOIN services s ON d.dept_id = s.dept_id
GROUP BY f.floor_number, d.dept_name
ORDER BY f.floor_number DESC;

-- 3. 업무 분류별 상세 현황
SELECT sc.category_name as 분류,
       d.dept_name as 부서명,
       s.service_name as 업무명,
       s.processing_time as 처리시간
FROM service_categories sc
JOIN services s ON sc.category_id = s.category_id
JOIN departments d ON s.dept_id = d.dept_id
WHERE sc.category_name = '민원접수'
ORDER BY d.dept_name, s.service_name;

-- 4. 가정법원 vs 서부지원 업무 비교
SELECT court_affiliation as 소속법원,
       COUNT(DISTINCT d.dept_id) as 부서수,
       COUNT(s.service_id) as 업무수
FROM departments d
LEFT JOIN services s ON d.dept_id = s.dept_id
WHERE court_affiliation IN ('가정법원', '서부지원')
GROUP BY court_affiliation;

-- 5. 즉시처리 가능한 업무 조회
SELECT d.dept_name as 부서명,
       s.service_name as 업무명,
       d.floor_numbers as 위치
FROM services s
JOIN departments d ON s.dept_id = d.dept_id
WHERE s.processing_time LIKE '%즉시%'
ORDER BY d.floor_numbers;
