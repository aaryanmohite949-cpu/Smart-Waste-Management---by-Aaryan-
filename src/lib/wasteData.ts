import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";

export interface WasteRecord {
    id: string;
    date: string; // YYYY-MM-DD
    property_id: string;
    user_id: string;
    wet_waste_weight: number;
    dry_waste_weight: number;
    segregation_correct: boolean;
    points_earned: number;
}

// 10 points per kg of properly segregated waste
// 2 bonus points if segregation is GOOD for 7 consecutive days
const calculatePoints = (wet: number, dry: number, isGood: boolean): number => {
    if (!isGood) return 0;
    return Math.round((wet + dry) * 10);
};

export const getWasteRecords = (userId: string): WasteRecord[] => {
    const data = localStorage.getItem(`waste_records_${userId}`);
    if (!data) return [];
    return JSON.parse(data);
};

export const saveWasteRecords = (userId: string, records: WasteRecord[]) => {
    localStorage.setItem(`waste_records_${userId}`, JSON.stringify(records));
};

export const generateRandomWaste = (userId: string, property_id: string, dateStr?: string): WasteRecord => {
    const wet = Number((Math.random() * (3 - 0.5) + 0.5).toFixed(2));
    const dry = Number((Math.random() * (2 - 0.2) + 0.2).toFixed(2));

    const total = wet + dry;
    const isGood = wet <= (total * 0.6) && dry <= (total * 0.4);

    let points = calculatePoints(wet, dry, isGood);

    // Check 7 consecutive days logic (mocked simplify)
    const existing = getWasteRecords(userId);
    const consecutiveGood = existing.slice(-6).every(r => r.segregation_correct);
    if (isGood && consecutiveGood && existing.length >= 6) {
        points += 2;
    }

    const record: WasteRecord = {
        id: crypto.randomUUID(),
        date: dateStr || format(new Date(), "yyyy-MM-dd"),
        property_id,
        user_id: userId,
        wet_waste_weight: wet,
        dry_waste_weight: dry,
        segregation_correct: isGood,
        points_earned: points,
    };

    return record;
};

export const addSimulatedEntry = (userId: string, property_id: string, dateStr?: string) => {
    const records = getWasteRecords(userId);
    const newRecord = generateRandomWaste(userId, property_id, dateStr);
    records.push(newRecord);
    saveWasteRecords(userId, records);

    // Update total points in profile mock
    const existingStr = localStorage.getItem(`profile_mock_${userId}`);
    const existing = existingStr ? JSON.parse(existingStr) : {};
    const newTotal = (existing.total_points || 0) + newRecord.points_earned;

    // Update tax discount
    let tax = 0;
    if (newTotal >= 1000) tax = 20;
    else if (newTotal >= 501) tax = 10;
    else if (newTotal >= 201) tax = 5;

    localStorage.setItem(`profile_mock_${userId}`, JSON.stringify({
        ...existing,
        total_points: newTotal,
        tax_discount_eligibility: tax
    }));

    // Fire event to notify app of data change
    window.dispatchEvent(new Event('waste_data_updated'));

    return newRecord;
};

// Initialize with some mock data if empty
export const initializeMockData = (userId: string, property_id: string) => {
    const existing = getWasteRecords(userId);
    if (existing.length === 0) {
        const records: WasteRecord[] = [];
        let totalPoints = 0;

        // Generate past 30 days
        for (let i = 30; i >= 0; i--) {
            const date = format(subDays(new Date(), i), "yyyy-MM-dd");
            const r = generateRandomWaste(userId, property_id, date);
            records.push(r);
            totalPoints += r.points_earned;
        }
        saveWasteRecords(userId, records);

        let tax = 0;
        if (totalPoints >= 1000) tax = 20;
        else if (totalPoints >= 501) tax = 10;
        else if (totalPoints >= 201) tax = 5;

        const existingProfile = localStorage.getItem(`profile_mock_${userId}`);
        const profileData = existingProfile ? JSON.parse(existingProfile) : {};

        localStorage.setItem(`profile_mock_${userId}`, JSON.stringify({
            ...profileData,
            total_points: totalPoints,
            tax_discount_eligibility: tax
        }));
    }
};

export const getWasteStats = (userId: string) => {
    const records = getWasteRecords(userId);
    const today = format(new Date(), "yyyy-MM-dd");

    const todayRecord = records.find(r => r.date === today);

    const currentMonthStart = startOfMonth(new Date());
    const currentMonthEnd = endOfMonth(new Date());

    const thisMonthRecords = records.filter(r => {
        const d = parseISO(r.date);
        return isWithinInterval(d, { start: currentMonthStart, end: currentMonthEnd });
    });

    const monthlyTotalWet = thisMonthRecords.reduce((sum, r) => sum + r.wet_waste_weight, 0);
    const monthlyTotalDry = thisMonthRecords.reduce((sum, r) => sum + r.dry_waste_weight, 0);

    return {
        today: todayRecord || { wet_waste_weight: 0, dry_waste_weight: 0, segregation_correct: false },
        monthlyWet: monthlyTotalWet,
        monthlyDry: monthlyTotalDry,
        monthlyTotal: monthlyTotalWet + monthlyTotalDry,
        history: records
    };
};
