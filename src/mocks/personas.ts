import type { Persona } from "@/types";

// 5 persona fixtures — UX 템플릿 8섹션 + _sim 필드.
// Lumi Cashback 카드 타겟군의 다양성: 디지털 숙련도/소득/라이프스타일/innovation 곡선 분산.

export const MOCK_PERSONAS: Persona[] = [
  // ─────────────────────────────────────────────
  // 1) 박지영 — 30대 초반 워킹맘 (early majority)
  // ─────────────────────────────────────────────
  {
    id: "persona-park-jiyoung",
    basic: {
      name: "박지영",
      age_range: "30대 초반",
      age_exact: 33,
      occupation: "초등학교 교사 (서울 강서구)",
      digital_literacy: "high",
    },
    goals: [
      "둘째 출산 후 가계 안정",
      "워라밸을 지키며 월 50만원 저축",
      "아이와 보내는 주말 늘리기",
    ],
    pain_points: [
      "월말 카드값 부담",
      "교통비·점심값 새는 돈 통제 어려움",
      "재테크 정보를 알아볼 시간 부족",
    ],
    behaviors: [
      "출근길 인스타그램 20분 (육아·살림 콘텐츠)",
      "점심 시간 동료들과 카페 (스타벅스·이디야)",
      "주말 마트 대량 구매",
      "저녁 아이 재운 뒤 유튜브 30분",
    ],
    triggers: [
      "동료 추천",
      "구체적 금액이 적힌 광고 (예: '월 5만원')",
      "한정 이벤트",
    ],
    barriers: [
      "기존 신한카드 잘 쓰고 있어서 굳이?",
      "카드 발급 절차가 복잡할까봐",
      "광고 카피의 과장 의심",
    ],
    resonating_messages: [
      "가족 시간",
      "복잡하지 않게 자동으로",
      "실제로 얼마 돌려받는지 숫자",
    ],
    expected_experience: ["3분 내 가입", "친구처럼 친근한 알림", "투명한 적립 내역"],
    success_criteria: ["월 3만원 이상 캐시백 체감", "남편/동료에게 자발적 추천"],
    _sim: {
      marital_status: "married",
      children_count: 1,
      children_ages: [4],
      household_size: 3,
      housing: "rent_jeonse",
      region: { city: "서울", district: "강서구" },
      income_monthly_krw: 4_200_000,
      income_decile: 7,
      price_sensitivity: 0.7,
      brand_loyalty: 0.55,
      media_channels: [
        { channel: "instagram", daily_minutes: 35, receptivity_to_ads: 0.5 },
        { channel: "youtube", daily_minutes: 30, receptivity_to_ads: 0.4 },
        { channel: "kakao_talk", daily_minutes: 60, receptivity_to_ads: 0.3 },
        { channel: "naver_search", daily_minutes: 15, receptivity_to_ads: 0.7 },
        { channel: "subway_ad", daily_minutes: 25, receptivity_to_ads: 0.3 },
      ],
      innovation_adoption: "early_majority",
      category_preferences: {
        신용카드: { current_brand: "신한카드 Deep Dream", satisfaction: 0.6, willing_to_switch: 0.55 },
        커피: { current_brand: "스타벅스", satisfaction: 0.8, willing_to_switch: 0.2 },
      },
    },
    current_state: {
      sim_timestamp: "2026-05-16T07:00:00",
      mood: { valence: 0.3, arousal: 0.5 },
      energy: 0.7,
      balance_krw: 1_800_000,
      open_intents: [],
    },
  },

  // ─────────────────────────────────────────────
  // 2) 김도윤 — 20대 후반 IT 개발자 (early adopter)
  // ─────────────────────────────────────────────
  {
    id: "persona-kim-doyun",
    basic: {
      name: "김도윤",
      age_range: "20대 후반",
      age_exact: 28,
      occupation: "스타트업 백엔드 개발자 (강남)",
      digital_literacy: "expert",
    },
    goals: [
      "사이드 프로젝트로 월 100만원 추가 수입",
      "30대 진입 전 1억 모으기",
      "최신 핀테크/AI 트렌드 따라가기",
    ],
    pain_points: [
      "야근 후 외식이 잦아 식비 폭주",
      "여러 카드/페이를 관리하기 귀찮음",
      "은행 앱 UI 가 답답함",
    ],
    behaviors: [
      "출근 지하철 30분 유튜브 (테크 채널)",
      "토스/카뱅 앱으로 가계부 자동 정리",
      "주말 카페에서 사이드 코딩 (스타벅스)",
      "트위터·HN·디스코드 활동",
    ],
    triggers: [
      "GitHub 트렌드/HN 헤드라인",
      "토스 푸시 알림의 위트 있는 카피",
      "친한 개발자 추천",
    ],
    barriers: [
      "카드 발급 시 종이 서류 = 즉시 이탈",
      "캐시백 한도 낮으면 비효율로 봄",
      "마케팅 카피 과장이면 바로 의심",
    ],
    resonating_messages: [
      "자동화",
      "정확한 숫자/한도",
      "심플한 가입",
    ],
    expected_experience: ["앱 내 30초 가입", "토스/카뱅과 자연 연동", "정산 내역 API"],
    success_criteria: ["월 4만원 이상 캐시백", "다른 카드 모두 정리하고 1장으로 통합"],
    _sim: {
      marital_status: "single",
      children_count: 0,
      children_ages: [],
      household_size: 1,
      housing: "rent_monthly",
      region: { city: "서울", district: "강남구" },
      income_monthly_krw: 5_500_000,
      income_decile: 8,
      price_sensitivity: 0.5,
      brand_loyalty: 0.3,
      media_channels: [
        { channel: "youtube", daily_minutes: 50, receptivity_to_ads: 0.35 },
        { channel: "instagram", daily_minutes: 15, receptivity_to_ads: 0.35 },
        { channel: "naver_search", daily_minutes: 10, receptivity_to_ads: 0.65 },
        { channel: "google_search", daily_minutes: 20, receptivity_to_ads: 0.55 },
        { channel: "subway_ad", daily_minutes: 30, receptivity_to_ads: 0.4 },
        { channel: "blog_review", daily_minutes: 15, receptivity_to_ads: 0.75 },
      ],
      innovation_adoption: "early_adopter",
      category_preferences: {
        신용카드: { current_brand: "토스 카드", satisfaction: 0.85, willing_to_switch: 0.3 },
        커피: { current_brand: "스타벅스", satisfaction: 0.7, willing_to_switch: 0.4 },
      },
    },
    current_state: {
      sim_timestamp: "2026-05-16T07:00:00",
      mood: { valence: 0.4, arousal: 0.6 },
      energy: 0.6,
      balance_krw: 3_200_000,
      open_intents: [],
    },
  },

  // ─────────────────────────────────────────────
  // 3) 이수민 — 20대 초반 대학생 (innovator, 저소득)
  // ─────────────────────────────────────────────
  {
    id: "persona-lee-sumin",
    basic: {
      name: "이수민",
      age_range: "20대 초반",
      age_exact: 22,
      occupation: "대학생 + 카페 알바 (성북구)",
      digital_literacy: "expert",
    },
    goals: [
      "용돈 부족 보충",
      "졸업 전 해외여행 자금 모으기",
      "친구들과 어울리는 약속 줄이지 않기",
    ],
    pain_points: [
      "월말 잔고 0원",
      "카페·배달비가 가장 큰 지출",
      "신용카드 발급 자체가 어려움 (소득 증명)",
    ],
    behaviors: [
      "하루 종일 인스타/틱톡 (3시간+)",
      "친구들과 단체 카톡 활발",
      "스타벅스 사이렌오더로 매일 음료",
      "유튜브 쇼츠 무한 스크롤",
    ],
    triggers: [
      "친구 단톡방 추천",
      "릴스/쇼츠에서 본 카피",
      "한정 굿즈/리워드",
    ],
    barriers: [
      "체크카드만 발급 가능 (신용 X)",
      "광고가 노골적이면 거부감",
      "복잡한 가입 절차 시 즉시 이탈",
    ],
    resonating_messages: [
      "친구들이 다 쓴다",
      "굳이 더 안 써도 적립",
      "감각적 비주얼",
    ],
    expected_experience: ["인스타 광고 → 1탭으로 가입", "체크카드도 동일 혜택", "이모지 가득한 알림"],
    success_criteria: ["월 1만원이라도 캐시백", "친구들에게 자랑할 가치"],
    _sim: {
      marital_status: "single",
      children_count: 0,
      children_ages: [],
      household_size: 1,
      housing: "with_parents",
      region: { city: "서울", district: "성북구" },
      income_monthly_krw: 800_000,
      income_decile: 3,
      price_sensitivity: 0.95,
      brand_loyalty: 0.4,
      media_channels: [
        { channel: "instagram", daily_minutes: 90, receptivity_to_ads: 0.45 },
        { channel: "tiktok", daily_minutes: 75, receptivity_to_ads: 0.55 },
        { channel: "youtube", daily_minutes: 40, receptivity_to_ads: 0.35 },
        { channel: "kakao_talk", daily_minutes: 120, receptivity_to_ads: 0.35 },
        { channel: "word_of_mouth", daily_minutes: 0, receptivity_to_ads: 0.85 },
      ],
      innovation_adoption: "innovator",
      category_preferences: {
        신용카드: { satisfaction: 0.3, willing_to_switch: 0.8 },
        커피: { current_brand: "스타벅스", satisfaction: 0.9, willing_to_switch: 0.15 },
      },
    },
    current_state: {
      sim_timestamp: "2026-05-16T07:00:00",
      mood: { valence: 0.55, arousal: 0.65 },
      energy: 0.75,
      balance_krw: 180_000,
      open_intents: [],
    },
  },

  // ─────────────────────────────────────────────
  // 4) 정현우 — 40대 중반 부장, 보수적 (late majority)
  // ─────────────────────────────────────────────
  {
    id: "persona-jung-hyunwoo",
    basic: {
      name: "정현우",
      age_range: "40대 중반",
      age_exact: 46,
      occupation: "대기업 영업부장 (분당)",
      digital_literacy: "medium",
    },
    goals: [
      "아이 두 명 사교육비 충당",
      "내 집 마련 대출 빨리 상환",
      "은퇴 자산 마련",
    ],
    pain_points: [
      "월급의 대부분이 고정 지출 (대출·학원·공과금)",
      "신용카드 5장 — 어느 게 어디 혜택인지 모름",
      "새 카드 발급은 번거롭게 느낌",
    ],
    behaviors: [
      "출근 차 안 라디오/뉴스",
      "점심 회식 = 법인카드, 저녁 가족 외식 = 개인카드",
      "주말 골프/등산",
      "유튜브로 부동산 채널 1시간",
    ],
    triggers: [
      "와이프 또는 동료 직접 추천",
      "신문 경제면 기사",
      "은행 PB 권유",
    ],
    barriers: [
      "이미 카드 너무 많음 — 추가 부담",
      "젊은 브랜드 컬러/카피 거부감",
      "복잡한 혜택 구조 싫어함",
    ],
    resonating_messages: [
      "안정적 혜택, 단순한 구조",
      "전 가족이 같이 혜택",
      "은행/카드사 브랜드 신뢰",
    ],
    expected_experience: ["기존 카드사 앱에 추가 카드로 통합", "고지서가 명확", "PB 상담 가능"],
    success_criteria: ["월 5만원 이상 캐시백 + 절세 효과", "와이프가 만족"],
    _sim: {
      marital_status: "married",
      children_count: 2,
      children_ages: [12, 9],
      household_size: 4,
      housing: "owned",
      region: { city: "경기", district: "성남시 분당구" },
      income_monthly_krw: 9_500_000,
      income_decile: 9,
      price_sensitivity: 0.45,
      brand_loyalty: 0.75,
      media_channels: [
        { channel: "youtube", daily_minutes: 60, receptivity_to_ads: 0.3 },
        { channel: "tv", daily_minutes: 90, receptivity_to_ads: 0.45 },
        { channel: "naver_search", daily_minutes: 15, receptivity_to_ads: 0.55 },
        { channel: "kakao_talk", daily_minutes: 30, receptivity_to_ads: 0.25 },
        { channel: "blog_review", daily_minutes: 10, receptivity_to_ads: 0.7 },
      ],
      innovation_adoption: "late_majority",
      category_preferences: {
        신용카드: { current_brand: "현대카드 the Black", satisfaction: 0.75, willing_to_switch: 0.25 },
        커피: { current_brand: "투썸플레이스", satisfaction: 0.65, willing_to_switch: 0.35 },
      },
    },
    current_state: {
      sim_timestamp: "2026-05-16T07:00:00",
      mood: { valence: 0.1, arousal: 0.4 },
      energy: 0.55,
      balance_krw: 6_500_000,
      open_intents: [],
    },
  },

  // ─────────────────────────────────────────────
  // 5) 최은영 — 30대 후반 프리랜서 디자이너 (early adopter, 가성비형)
  // ─────────────────────────────────────────────
  {
    id: "persona-choi-eunyoung",
    basic: {
      name: "최은영",
      age_range: "30대 후반",
      age_exact: 37,
      occupation: "프리랜서 UX 디자이너 (성수동)",
      digital_literacy: "high",
    },
    goals: [
      "월 수입 변동성 줄이기",
      "디자인 영감 + 자기관리 시간 확보",
      "노후 대비 ETF 매월 매수",
    ],
    pain_points: [
      "프리랜서라 수입 들쭉날쭉, 카드 한도 낮음",
      "거래처 미수금 추적 피곤",
      "광고에 자주 노출되지만 '나는 다르다' 의식",
    ],
    behaviors: [
      "아침 카페 작업 2시간 (홈카페 아니면 스타벅스 리저브)",
      "인스타 디자인 레퍼런스 수집",
      "주 1회 친구들과 와인바",
      "Notion·Toss 가계부 매일 정리",
    ],
    triggers: [
      "에디터 톤의 광고 (감성·미니멀)",
      "동료 디자이너 추천",
      "한정판/구즈와 결합",
    ],
    barriers: [
      "노골적인 캐시백 강조 = 천박해 보임",
      "은행 앱 UI 가 디자인적으로 별로면 안 씀",
      "소액 카드 = 자존심 손상",
    ],
    resonating_messages: [
      "감각적 카드 디자인",
      "라이프스타일 큐레이션",
      "프리랜서 친화 (서류 없이)",
    ],
    expected_experience: ["디자인이 예쁜 실물 카드", "Notion API 연동", "스타벅스 리저브 매장 우대"],
    success_criteria: ["월 3만원 캐시백 + 인스타에 자랑할 디자인"],
    _sim: {
      marital_status: "single",
      children_count: 0,
      children_ages: [],
      household_size: 1,
      housing: "rent_monthly",
      region: { city: "서울", district: "성동구" },
      income_monthly_krw: 6_000_000,
      income_decile: 8,
      price_sensitivity: 0.4,
      brand_loyalty: 0.5,
      media_channels: [
        { channel: "instagram", daily_minutes: 70, receptivity_to_ads: 0.4 },
        { channel: "blog_review", daily_minutes: 25, receptivity_to_ads: 0.7 },
        { channel: "podcast", daily_minutes: 40, receptivity_to_ads: 0.5 },
        { channel: "youtube", daily_minutes: 30, receptivity_to_ads: 0.3 },
        { channel: "naver_search", daily_minutes: 8, receptivity_to_ads: 0.6 },
      ],
      innovation_adoption: "early_adopter",
      category_preferences: {
        신용카드: { current_brand: "현대카드 ZERO", satisfaction: 0.55, willing_to_switch: 0.65 },
        커피: { current_brand: "스타벅스 리저브", satisfaction: 0.9, willing_to_switch: 0.15 },
      },
    },
    current_state: {
      sim_timestamp: "2026-05-16T07:00:00",
      mood: { valence: 0.35, arousal: 0.45 },
      energy: 0.6,
      balance_krw: 4_500_000,
      open_intents: [],
    },
  },
];
