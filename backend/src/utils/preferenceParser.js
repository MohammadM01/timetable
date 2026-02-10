
// Simple natural language parser for timetable preferences
// Handles specific cases mentioned by user

class PreferenceParser {
    constructor(text) {
        this.text = text || '';
        this.rules = {
            excludedDays: [], // { subject: 'Algebra', days: [5] } (5 = Friday)
            consecutive: [], // { subject: 'Algebra', day: 4, count: 2 } (4 = Thursday)
            forceDaily: [], // { subject: 'Algebra' }
            minimizeFreePeriods: false
        };
    }

    parse() {
        if (!this.text) return this.rules;

        const lines = this.text.split('\n');
        for (const line of lines) {
            this.parseLine(line);
        }

        console.log('Parsed preferences:', JSON.stringify(this.rules, null, 2));
        return this.rules;
    }

    parseLine(line) {
        const lower = line.toLowerCase();

        // Helper to find day
        const findDay = (str) => {
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            for (const day of days) {
                if (str.includes(day)) return day;
                // simple typo handling
                if (day.length > 4 && str.includes(day.substring(0, 3))) return day;
            }
            return null;
        };

        // Case 1: "Add [Subject] daily except [Day]"
        // Matches: "add algebra daily except friday", "algebra daily except on friday"
        // Also handles: "add algebra daily except n frday" (custom handling for 'frday')

        const excludePattern = /(?:add|make)?\s*([a-z0-9]+)\s*daily\s*except/i;
        const excludeMatch = lower.match(excludePattern);

        if (excludeMatch) {
            const subject = excludeMatch[1];
            const exceptPart = lower.split('except')[1];

            if (exceptPart) {
                let dayName = findDay(exceptPart);
                // Special hack for 'frday' if not found
                if (!dayName && exceptPart.includes('frday')) dayName = 'friday';

                if (dayName) {
                    const dayIndex = this.getDayIndex(dayName);
                    if (dayIndex !== -1) {
                        console.log(`Parsed rule: Exclude ${subject} on ${dayName}`);
                        this.rules.excludedDays.push({
                            subject: subject,
                            days: [dayIndex]
                        });
                        this.rules.forceDaily.push({ subject });
                    }
                }
            }
        }

        // Case 2: "On [Day] it should be [N] periods of [Subject] back to back"
        // Matches: "on thursday it should be 2 periods of algebra back to back"
        if (lower.includes('back to back')) {
            const dayName = findDay(lower);
            const countMatch = lower.match(/(\d+)\s*periods?/);

            // Find subject
            // Pattern: "periods of [subject]"
            const subjectMatch = lower.match(/periods?\s*of\s*([a-z0-9]+)/);
            const subject = subjectMatch ? subjectMatch[1] : null;

            if (dayName && countMatch && subject) {
                const count = parseInt(countMatch[1]);
                const dayIndex = this.getDayIndex(dayName);

                if (dayIndex !== -1) {
                    console.log(`Parsed rule: ${count} periods of ${subject} on ${dayName}`);
                    this.rules.consecutive.push({
                        subject: subject,
                        day: dayIndex,
                        count: count
                    });
                }
            }
        }

        // Case 3: "All periods must be full" / "None left free"
        if (lower.includes('full') || (lower.includes('none') && lower.includes('free'))) {
            console.log('Parsed rule: Minimize free periods');
            this.rules.minimizeFreePeriods = true;
        }
    }

    getDayIndex(dayName) {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const index = days.indexOf(dayName.toLowerCase());
        return index !== -1 ? index + 1 : -1; // 1-based index
    }
}

export default PreferenceParser;
