/**
 * 대구법원청사관리시스템 - 브라우저용 데이터베이스 핸들러
 * SQL.js 라이브러리를 사용하여 SQLite 데이터베이스를 브라우저에서 처리
 * 
 * 필요 라이브러리: sql.js (https://sql.js.org/)
 * CDN: <script src="https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js"></script>
 */

class CourtDatabaseHandler {
    constructor() {
        this.db = null;
        this.SQL = null;
    }

    /**
     * SQL.js 초기화 및 데이터베이스 로드
     * @param {string} dbPath - 데이터베이스 파일 경로
     */
    async initialize(dbPath = '대구법원청사관리시스템_v2.db') {
        try {
            // SQL.js 초기화
            this.SQL = await initSqlJs({
                locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
            });

            // 데이터베이스 파일 로드
            const response = await fetch(dbPath);
            const buffer = await response.arrayBuffer();
            this.db = new this.SQL.Database(new Uint8Array(buffer));

            console.log('✅ 데이터베이스 초기화 완료');
            return true;
        } catch (error) {
            console.error('❌ 데이터베이스 초기화 실패:', error);
            return false;
        }
    }

    /**
     * SQL 쿼리 실행
     * @param {string} query - SQL 쿼리
     * @param {Array} params - 쿼리 파라미터
     * @returns {Array} 쿼리 결과
     */
    executeQuery(query, params = []) {
        try {
            const result = this.db.exec(query, params);
            return this.formatQueryResult(result);
        } catch (error) {
            console.error('❌ 쿼리 실행 오류:', error);
            return [];
        }
    }

    /**
     * 쿼리 결과를 객체 배열로 변환
     * @param {Array} result - SQL.js 쿼리 결과
     * @returns {Array} 객체 배열
     */
    formatQueryResult(result) {
        if (!result || result.length === 0) return [];

        const { columns, values } = result[0];
        return values.map(row => {
            const obj = {};
            columns.forEach((col, index) => {
                obj[col] = row[index];
            });
            return obj;
        });
    }

    /**
     * 모든 부서 조회
     * @returns {Array} 부서 목록
     */
    getAllDepartments() {
        const query = `
            SELECT dept_id, dept_name, dept_detail, floor_numbers, 
                   room_numbers, dept_type, court_affiliation
            FROM departments
            ORDER BY floor_numbers DESC, dept_id
        `;
        return this.executeQuery(query);
    }

    /**
     * 특정 층의 부서 조회
     * @param {number} floorNumber - 층 번호
     * @returns {Array} 부서 목록
     */
    getDepartmentsByFloor(floorNumber) {
        const query = `
            SELECT dept_id, dept_name, dept_detail, room_numbers, dept_type
            FROM departments
            WHERE floor_numbers = ?
            ORDER BY dept_id
        `;
        return this.executeQuery(query, [floorNumber.toString()]);
    }

    /**
     * 특정 부서의 업무 조회
     * @param {number} deptId - 부서 ID
     * @returns {Array} 업무 목록
     */
    getServicesByDepartment(deptId) {
        const query = `
            SELECT s.service_id, s.service_name, s.required_documents,
                   s.processing_time, s.service_fee, sc.category_name
            FROM services s
            JOIN service_categories sc ON s.category_id = sc.category_id
            WHERE s.dept_id = ? AND s.is_available = 1
            ORDER BY s.service_id
        `;
        return this.executeQuery(query, [deptId]);
    }

    /**
     * 부서명으로 검색
     * @param {string} keyword - 검색 키워드
     * @returns {Array} 검색 결과
     */
    searchDepartment(keyword) {
        const query = `
            SELECT dept_id, dept_name, dept_detail, floor_numbers, room_numbers
            FROM departments
            WHERE dept_name LIKE ? OR dept_detail LIKE ?
            ORDER BY dept_id
        `;
        const searchTerm = `%${keyword}%`;
        return this.executeQuery(query, [searchTerm, searchTerm]);
    }

    /**
     * 업무명으로 검색
     * @param {string} keyword - 검색 키워드
     * @returns {Array} 검색 결과 (부서 정보 포함)
     */
    searchService(keyword) {
        const query = `
            SELECT s.service_name, d.dept_name, d.dept_detail, 
                   d.floor_numbers, d.room_numbers, s.required_documents,
                   s.processing_time, s.service_fee
            FROM services s
            JOIN departments d ON s.dept_id = d.dept_id
            WHERE s.service_name LIKE ? AND s.is_available = 1
            ORDER BY d.floor_numbers, s.service_id
        `;
        return this.executeQuery(query, [`%${keyword}%`]);
    }

    /**
     * 부서까지의 경로 안내 조회
     * @param {number} deptId - 부서 ID
     * @returns {Object} 경로 정보
     */
    getNavigationToDepartment(deptId) {
        const query = `
            SELECT h.department_name, h.navigation_steps,
                   d.floor_numbers, d.room_numbers
            FROM how_to_go h
            JOIN departments d ON h.dept_id = d.dept_id
            WHERE h.dept_id = ?
        `;
        const result = this.executeQuery(query, [deptId]);
        if (result.length > 0) {
            const data = result[0];
            try {
                data.navigation_steps = JSON.parse(data.navigation_steps);
            } catch (e) {
                console.error('경로 정보 파싱 오류:', e);
            }
            return data;
        }
        return null;
    }

    /**
     * 업무 분류별 통계
     * @returns {Array} 분류별 업무 개수
     */
    getServiceStatsByCategory() {
        const query = `
            SELECT sc.category_name, sc.category_desc,
                   COUNT(s.service_id) as service_count
            FROM service_categories sc
            LEFT JOIN services s ON sc.category_id = s.category_id
            GROUP BY sc.category_id
            ORDER BY service_count DESC
        `;
        return this.executeQuery(query);
    }

    /**
     * 법원별 부서 통계
     * @returns {Array} 법원별 부서 개수
     */
    getDepartmentStatsByCourt() {
        const query = `
            SELECT court_affiliation, COUNT(*) as dept_count
            FROM departments
            GROUP BY court_affiliation
            ORDER BY dept_count DESC
        `;
        return this.executeQuery(query);
    }

    /**
     * 층별 정보 조회
     * @returns {Array} 층별 정보
     */
    getAllFloors() {
        const query = `
            SELECT floor_number, departments_summary, floor_type
            FROM floors
            ORDER BY floor_number DESC
        `;
        return this.executeQuery(query);
    }

    /**
     * 청사 정보 조회
     * @returns {Object} 청사 정보
     */
    getBuildingInfo() {
        const query = `
            SELECT * FROM buildings WHERE building_id = 1
        `;
        const result = this.executeQuery(query);
        return result.length > 0 ? result[0] : null;
    }

    /**
     * 종합 검색 (부서 + 업무)
     * @param {string} keyword - 검색 키워드
     * @returns {Object} 검색 결과 (부서, 업무)
     */
    comprehensiveSearch(keyword) {
        return {
            departments: this.searchDepartment(keyword),
            services: this.searchService(keyword)
        };
    }

    /**
     * 데이터베이스 연결 종료
     */
    close() {
        if (this.db) {
            this.db.close();
            console.log('✅ 데이터베이스 연결 종료');
        }
    }
}

// 사용 예제
/*
const courtDB = new CourtDatabaseHandler();

// 초기화
await courtDB.initialize('대구법원청사관리시스템_v2.db');

// 모든 부서 조회
const departments = courtDB.getAllDepartments();
console.log('모든 부서:', departments);

// 3층 부서 조회
const floor3Depts = courtDB.getDepartmentsByFloor(3);
console.log('3층 부서:', floor3Depts);

// 특정 부서의 업무 조회
const services = courtDB.getServicesByDepartment(14); // 가사과
console.log('가사과 업무:', services);

// 부서 검색
const searchResult = courtDB.searchDepartment('민사');
console.log('민사 검색 결과:', searchResult);

// 업무 검색
const serviceSearch = courtDB.searchService('이혼');
console.log('이혼 관련 업무:', serviceSearch);

// 경로 안내
const navigation = courtDB.getNavigationToDepartment(14);
console.log('가사과 가는 길:', navigation);

// 통계
const categoryStats = courtDB.getServiceStatsByCategory();
console.log('업무 분류별 통계:', categoryStats);

// 종료
courtDB.close();
*/

// ES6 모듈로 내보내기 (필요시)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CourtDatabaseHandler;
}
