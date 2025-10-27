/**
 * 대구법원청사관리시스템 - 브라우저용 데이터베이스 핸들러
 * SQL.js 라이브러리를 사용하여 SQLite 데이터베이스를 브라우저에서 처리
 * 
 * 필요 라이브러리: sql.js (https://sql.js.org/)
 * CDN: <script src="https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js"></script>
 */

class CourtDatabaseHandler {
    constructor() {
        this.db = null;
        this.SQL = null;
        this.isInitialized = false;
    }

    /**
     * SQL.js 초기화 및 데이터베이스 로드
     * @param {string} dbPath - 데이터베이스 파일 경로
     */
    async initialize(dbPath = '대구법원청사관리시스템_v2_4.db') {
        try {
            console.log('🔄 데이터베이스 초기화 시작...');
            console.log('📂 파일 경로:', dbPath);
            
            // SQL.js 초기화 - 버전 1.10.3 사용
            this.SQL = await initSqlJs({
                locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
            });
            console.log('✅ SQL.js 라이브러리 로드 완료');

            // 데이터베이스 파일 로드
            console.log('📥 데이터베이스 파일 다운로드 중...');
            const response = await fetch(dbPath);
            
            if (!response.ok) {
                throw new Error(`데이터베이스 파일을 찾을 수 없습니다: ${dbPath} (HTTP ${response.status})`);
            }

            const buffer = await response.arrayBuffer();
            console.log('📊 파일 크기:', (buffer.byteLength / 1024).toFixed(2), 'KB');
            
            // 파일 크기 확인
            if (buffer.byteLength === 0) {
                throw new Error('데이터베이스 파일이 비어있습니다');
            }

            // SQLite 파일 시그니처 확인
            const header = new Uint8Array(buffer.slice(0, 16));
            const headerString = String.fromCharCode(...header);
            
            if (!headerString.startsWith('SQLite format 3')) {
                console.error('파일 헤더:', headerString);
                throw new Error('유효한 SQLite 데이터베이스 파일이 아닙니다. 파일 형식을 확인하세요.');
            }
            console.log('✅ SQLite 파일 시그니처 확인 완료');

            // 데이터베이스 생성
            this.db = new this.SQL.Database(new Uint8Array(buffer));
            console.log('✅ 데이터베이스 객체 생성 완료');
            
            // 테이블 목록 조회로 연결 테스트
            const tables = this.db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
            if (tables.length > 0 && tables[0].values.length > 0) {
                console.log('📋 테이블 목록:', tables[0].values.map(t => t[0]).join(', '));
            }
            
            this.isInitialized = true;
            console.log('✅ 데이터베이스 초기화 완료');
            return true;
        } catch (error) {
            console.error('❌ 데이터베이스 초기화 실패:', error);
            console.error('상세 정보:', {
                message: error.message,
                stack: error.stack,
                dbPath: dbPath
            });
            this.isInitialized = false;
            throw error;
        }
    }

    /**
     * 데이터베이스 초기화 상태 확인
     * @returns {boolean}
     */
    checkInitialization() {
        if (!this.isInitialized || !this.db) {
            console.error('❌ 데이터베이스가 초기화되지 않았습니다. initialize() 메서드를 먼저 호출하세요.');
            return false;
        }
        return true;
    }

    /**
     * SQL 쿼리 실행
     * @param {string} query - SQL 쿼리
     * @param {Array} params - 쿼리 파라미터
     * @returns {Array} 쿼리 결과
     */
    executeQuery(query, params = []) {
        if (!this.checkInitialization()) {
            return [];
        }

        try {
            const result = this.db.exec(query, params);
            return this.formatQueryResult(result);
        } catch (error) {
            console.error('❌ 쿼리 실행 오류:', error);
            console.error('쿼리:', query);
            console.error('파라미터:', params);
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
        if (!this.checkInitialization()) return [];

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
        if (!this.checkInitialization()) return [];

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
        if (!this.checkInitialization()) return [];

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
        if (!this.checkInitialization()) return [];

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
        if (!this.checkInitialization()) return [];

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
        if (!this.checkInitialization()) return null;

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
        if (!this.checkInitialization()) return [];

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
        if (!this.checkInitialization()) return [];

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
        if (!this.checkInitialization()) return [];

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
        if (!this.checkInitialization()) return null;

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
        if (!this.checkInitialization()) {
            return { departments: [], services: [] };
        }
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

    /**
     * 데이터베이스를 바이너리로 내보내기
     * @returns {Uint8Array} 데이터베이스 바이너리
     */
    exportDatabase() {
        if (!this.checkInitialization()) return null;
        return this.db.export();
    }

    /**
     * INSERT 쿼리 실행
     * @param {string} table - 테이블명
     * @param {Object} data - 삽입할 데이터 객체
     * @returns {boolean} 성공 여부
     */
    insert(table, data) {
        if (!this.checkInitialization()) return false;

        try {
            const columns = Object.keys(data).join(', ');
            const placeholders = Object.keys(data).map(() => '?').join(', ');
            const values = Object.values(data);
            
            const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
            this.db.run(query, values);
            
            console.log('✅ 데이터 삽입 완료:', table);
            return true;
        } catch (error) {
            console.error('❌ 삽입 오류:', error);
            return false;
        }
    }

    /**
     * UPDATE 쿼리 실행
     * @param {string} table - 테이블명
     * @param {Object} data - 업데이트할 데이터 객체
     * @param {string} whereClause - WHERE 조건
     * @param {Array} whereParams - WHERE 파라미터
     * @returns {boolean} 성공 여부
     */
    update(table, data, whereClause, whereParams = []) {
        if (!this.checkInitialization()) return false;

        try {
            const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
            const values = [...Object.values(data), ...whereParams];
            
            const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
            this.db.run(query, values);
            
            console.log('✅ 데이터 수정 완료:', table);
            return true;
        } catch (error) {
            console.error('❌ 수정 오류:', error);
            return false;
        }
    }

    /**
     * DELETE 쿼리 실행
     * @param {string} table - 테이블명
     * @param {string} whereClause - WHERE 조건
     * @param {Array} whereParams - WHERE 파라미터
     * @returns {boolean} 성공 여부
     */
    delete(table, whereClause, whereParams = []) {
        if (!this.checkInitialization()) return false;

        try {
            const query = `DELETE FROM ${table} WHERE ${whereClause}`;
            this.db.run(query, whereParams);
            
            console.log('✅ 데이터 삭제 완료:', table);
            return true;
        } catch (error) {
            console.error('❌ 삭제 오류:', error);
            return false;
        }
    }

    /**
     * 트랜잭션 실행
     * @param {Function} callback - 트랜잭션 내에서 실행할 콜백
     * @returns {boolean} 성공 여부
     */
    transaction(callback) {
        if (!this.checkInitialization()) return false;

        try {
            this.db.run('BEGIN TRANSACTION');
            callback();
            this.db.run('COMMIT');
            console.log('✅ 트랜잭션 완료');
            return true;
        } catch (error) {
            this.db.run('ROLLBACK');
            console.error('❌ 트랜잭션 오류:', error);
            return false;
        }
    }
}

// 사용 예제
/*
const courtDB = new CourtDatabaseHandler();

// 초기화
await courtDB.initialize('대구법원청사관리시스템_v2_4.db');

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
