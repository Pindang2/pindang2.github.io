
-- 데이터베이스 백업 및 검증 쿼리

-- 1. 전체 데이터 개수 확인
SELECT 'buildings' as table_name, COUNT(*) as count FROM buildings
UNION ALL
SELECT 'floors', COUNT(*) FROM floors  
UNION ALL
SELECT 'departments', COUNT(*) FROM departments
UNION ALL
SELECT 'service_categories', COUNT(*) FROM service_categories
UNION ALL
SELECT 'services', COUNT(*) FROM services
UNION ALL
SELECT 'usage_stats', COUNT(*) FROM usage_stats;

-- 2. 데이터 무결성 검증
-- 2-1. 외래키 제약 조건 확인
SELECT d.dept_name, d.building_id
FROM departments d
LEFT JOIN buildings b ON d.building_id = b.building_id  
WHERE b.building_id IS NULL;

-- 2-2. 서비스와 부서 연결 확인
SELECT s.service_name, s.dept_id
FROM services s
LEFT JOIN departments d ON s.dept_id = d.dept_id
WHERE d.dept_id IS NULL;

-- 3. 주요 통계
-- 3-1. 부서 유형별 분포
SELECT dept_type, COUNT(*) as count
FROM departments  
GROUP BY dept_type
ORDER BY count DESC;

-- 3-2. 법원별 업무 분포  
SELECT d.court_affiliation, COUNT(s.service_id) as service_count
FROM departments d
LEFT JOIN services s ON d.dept_id = s.dept_id
GROUP BY d.court_affiliation
ORDER BY service_count DESC;
