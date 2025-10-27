
# 대구법원청사관리시스템 ERD (개체관계도)

## 테이블 관계 구조

```
buildings (청사정보)
    ├── building_id (PK)
    ├── building_name
    ├── address  
    ├── total_floors
    ├── building_type
    ├── court_types
    └── created_date

floors (층별정보)
    ├── floor_id (PK)
    ├── building_id (FK → buildings.building_id)
    ├── floor_number
    ├── departments_summary
    ├── floor_type
    └── accessibility

departments (부서정보)
    ├── dept_id (PK)
    ├── building_id (FK → buildings.building_id)
    ├── dept_name
    ├── floor_numbers
    ├── room_numbers
    ├── dept_type
    ├── court_affiliation
    ├── is_active
    ├── operating_hours
    └── contact_ext

service_categories (업무분류)
    ├── category_id (PK)
    ├── category_name
    ├── category_desc
    └── color_code

services (상세업무)
    ├── service_id (PK)
    ├── dept_id (FK → departments.dept_id)
    ├── category_id (FK → service_categories.category_id)
    ├── service_name
    ├── service_desc
    ├── required_documents
    ├── processing_time
    ├── service_fee
    ├── is_available
    ├── online_available
    ├── appointment_required
    └── created_date

usage_stats (이용통계)
    ├── stat_id (PK, AUTO_INCREMENT)
    ├── service_id (FK → services.service_id)
    ├── usage_date
    └── usage_count
```

## 주요 관계 (Relationships)

1. buildings (1) ──── (N) floors
   - 하나의 청사는 여러 층을 가짐

2. buildings (1) ──── (N) departments  
   - 하나의 청사는 여러 부서를 가짐

3. departments (1) ──── (N) services
   - 하나의 부서는 여러 업무를 담당

4. service_categories (1) ──── (N) services
   - 하나의 업무분류는 여러 업무를 포함

5. services (1) ──── (N) usage_stats
   - 하나의 업무는 여러 이용 통계 기록을 가짐

## 인덱스 권장사항

- departments.dept_name (부서명 검색용)
- services.service_name (업무명 검색용)  
- services.category_id (분류별 조회용)
- usage_stats.usage_date (날짜별 통계용)

## 확장 가능성

향후 추가 가능한 테이블:
- users (사용자 정보)
- appointments (예약 정보)
- feedback (민원 피드백)
- holidays (휴무일 정보)
- announcements (공지사항)
