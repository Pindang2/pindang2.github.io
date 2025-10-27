# 대구법원청사관리시스템 데이터베이스 v2.0

## 📊 데이터베이스 개요

**파일명**: 대구법원청사관리시스템_v2.db  
**형식**: SQLite3  
**생성일**: 2025-10-22  
**버전**: 2.0 (세부 부서 및 경로 정보 추가)

---

## 🏗️ 데이터베이스 구조

### 1. buildings (청사 정보)
- **목적**: 법원 청사의 기본 정보 저장
- **레코드 수**: 1건
- **주요 필드**:
  - building_id (PK): 청사 고유 ID
  - building_name: 청사명
  - address: 주소
  - total_floors: 총 층수 (8층)
  - court_types: 소속 법원 (가정법원, 서부지원)

### 2. floors (층별 정보)
- **목적**: 각 층의 부서 배치 현황 저장
- **레코드 수**: 8건 (1층~8층)
- **주요 필드**:
  - floor_id (PK): 층 ID
  - floor_number: 층 번호
  - departments_summary: 층별 부서 요약
  - floor_type: 층 유형 (민원층/업무층)

### 3. departments (부서 정보) ⭐ v2.0 세분화
- **목적**: 세부 부서별 위치 및 정보 저장
- **레코드 수**: 35건 (v1: 13건 → v2: 35건)
- **주요 변경사항**:
  - ✅ 법정을 개별 호수로 세분화 (10개)
  - ✅ 조정실을 각 호수별로 분리 (11개)
  - ✅ 총무과 2개로 분리 (서부지원/가정법원)
  - ✅ 종합민원실 2개로 분리 (서부지원/가정법원)
  - ✅ 등기과 2개로 분리 (조사/접수)
  - ✅ 국민은행으로 변경 (기존 대구은행)
- **주요 필드**:
  - dept_id (PK): 부서 ID
  - dept_name: 부서 대분류명
  - dept_detail: 부서 상세명 (호수 포함)
  - floor_numbers: 위치한 층
  - room_numbers: 호실 번호
  - dept_type: 부서 유형
  - court_affiliation: 소속 법원

### 4. how_to_go (경로 안내) ⭐ v2.0 신규
- **목적**: 각 부서까지의 안내 경로 저장
- **레코드 수**: 35건
- **주요 필드**:
  - how_id (PK, AUTO_INCREMENT): 경로 ID
  - dept_id (FK): 부서 ID
  - department_name: 부서명
  - navigation_steps: JSON 형식 경로 단계

### 5. service_categories (업무 분류)
- **목적**: 법원 업무의 카테고리 분류
- **레코드 수**: 10건
- **분류**:
  1. 민원접수
  2. 재판관련
  3. 조정중재
  4. 등기업무
  5. 강제집행
  6. 가사업무
  7. 형사업무
  8. 증명발급
  9. 행정지원
  10. 편의서비스

### 6. services (상세 업무)
- **목적**: 각 부서에서 처리 가능한 상세 업무 정보
- **레코드 수**: 257건
- **주요 필드**:
  - service_id (PK): 업무 ID
  - dept_id (FK): 담당 부서 ID
  - category_id (FK): 업무 분류 ID
  - service_name: 업무명
  - required_documents: 필요 서류
  - processing_time: 처리 시간
  - service_fee: 수수료

### 7. usage_stats (이용 통계)
- **목적**: 향후 업무별 이용 통계 수집
- **레코드 수**: 0건 (확장용)

---

## 📈 주요 통계

### 부서 유형별 분포
- 재판지원: 13개 (조정실 등)
- 재판시설: 10개 (각 법정)
- 재판부: 3개 (민사과, 형사과, 가사과)
- 편의시설: 3개 (우체국, 은행, 식당)
- 행정지원: 2개 (총무과)
- 등기업무: 2개 (등기과)
- 민원지원: 2개 (종합민원실)

### 법원별 부서 분포
- 서부지원: 15개
- 공통: 14개
- 가정법원: 6개

### 층별 부서 분포
- 8층: 조정실 2개
- 7층: 조정실 2개
- 6층: 조정실 2개
- 5층: 조정실 2개 + 총무과 2개 + 가사과 + 조사실
- 4층: 조정실 2개 + 민사과 + 민사신청과 + 형사과
- 3층: 등기과 2개 + 형사법정 3개
- 2층: 민사법정 3개 + 형사법정 2개 + 가사법정 2개 + 조정실 1개
- 1층: 종합민원실 2개 + 편의시설 3개

---

## 🔗 테이블 간 관계

```
buildings (1) ─── (N) floors
buildings (1) ─── (N) departments
departments (1) ─── (N) services
departments (1) ─── (1) how_to_go
service_categories (1) ─── (N) services
services (1) ─── (N) usage_stats
```

---

## 💻 JavaScript API 사용법

### 초기화
```javascript
const courtDB = new CourtDatabaseHandler();
await courtDB.initialize('대구법원청사관리시스템_v2.db');
```

### 주요 메서드

1. **부서 조회**
   - `getAllDepartments()`: 모든 부서 목록
   - `getDepartmentsByFloor(floorNumber)`: 특정 층의 부서
   - `searchDepartment(keyword)`: 부서명 검색

2. **업무 조회**
   - `getServicesByDepartment(deptId)`: 특정 부서의 업무
   - `searchService(keyword)`: 업무명 검색

3. **경로 안내**
   - `getNavigationToDepartment(deptId)`: 부서까지 경로

4. **통계**
   - `getServiceStatsByCategory()`: 분류별 통계
   - `getDepartmentStatsByCourt()`: 법원별 통계

5. **종합 검색**
   - `comprehensiveSearch(keyword)`: 부서 + 업무 통합 검색

---

## 📁 제공 파일

1. **대구법원청사관리시스템_v2.db** - SQLite 데이터베이스
2. **court-database-handler.js** - JavaScript API 핸들러
3. **court-database-viewer.html** - 웹 기반 뷰어 인터페이스
4. **README.md** - 본 문서

---

## 🚀 사용 방법

### 웹 브라우저에서 사용
```bash
# 간단한 웹 서버 실행
python -m http.server 8000

# 브라우저에서 접속
http://localhost:8000/court-database-viewer.html
```

### JavaScript에서 직접 사용
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js"></script>
<script src="court-database-handler.js"></script>
<script>
  const courtDB = new CourtDatabaseHandler();
  await courtDB.initialize('대구법원청사관리시스템_v2.db');
  const departments = courtDB.getAllDepartments();
</script>
```

---

## 🔄 버전 히스토리

### v2.0 (2025-10-22)
- ✅ 부서 세분화 (13개 → 35개)
- ✅ 법정 개별화 (10개 법정)
- ✅ 총무과/종합민원실 분리 (서부지원/가정법원)
- ✅ how_to_go 테이블 추가
- ✅ 국민은행으로 업데이트
- ✅ JavaScript API 핸들러 제공
- ✅ 웹 뷰어 인터페이스 제공

### v1.0 (2025-10-16)
- 초기 데이터베이스 구축
- 기본 부서 및 업무 정보

---

## 📞 문의

대구가정법원·대구지방법원 서부지원  
주소: 대구광역시  
전화: 053-xxx-xxxx

---

**생성일**: 2025-10-22  
**최종 수정**: 2025-10-22
