
import OpenAI from "openai";
import PreferenceParser from './preferenceParser.js';

class AIPreferenceParser {
    constructor(preferences) {
        this.preferences = preferences;
        this.apiKey = process.env.OPENAI_API_KEY;
        this.openai = this.apiKey ? new OpenAI({ apiKey: this.apiKey }) : null;
        this.fallbackParser = new PreferenceParser(preferences);

        this.rules = {
            excludedDays: [],
            consecutive: [],
            forceDaily: [],
            minimizeFreePeriods: false
        };
    }

    async parse() {
        if (!this.preferences) return this.rules;

        // Fallback if no API key
        if (!this.openai) {
            console.log("No OpenAI API Key found. Using regex parser fallback.");
            return this.fallbackParser.parse();
        }

        try {
            console.log("Attempting AI preference parsing...");
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `You are a timetable preference parser. Convert user natural language requests into a structured JSON configuration for a timetable generator.
                        
                        The output format must be a JSON object with these keys:
                        - excludedDays: Array of objects { subject: string, days: number[] }. Days are 1=Monday, 2=Tuesday, etc.
                        - consecutive: Array of objects { subject: string, day: number, count: number }. Day is 1-based index (1=Monday).
                        - forceDaily: Array of objects { subject: string }.
                        - minimizeFreePeriods: boolean.

                        Example User Input: "Add Algebra daily except Friday. On Thursday make Algebra 2 periods back to back."
                        Example Output:
                        {
                            "excludedDays": [{ "subject": "Algebra", "days": [5] }],
                            "consecutive": [{ "subject": "Algebra", "day": 4, "count": 2 }],
                            "forceDaily": [{ "subject": "Algebra" }],
                            "minimizeFreePeriods": false
                        }
                        
                        Return ONLY the valid JSON object. Do not explain.`
                    },
                    {
                        role: "user",
                        content: this.preferences
                    }
                ],
                response_format: { type: "json_object" }
            });

            const parsed = JSON.parse(completion.choices[0].message.content);
            console.log("AI Parsed Preferences:", parsed);

            // Merge with default structure to ensure safety
            this.rules = { ...this.rules, ...parsed };
            return this.rules;

        } catch (error) {
            console.error("AI Parsing failed:", error.message);
            console.log("Falling back to regex parser.");
            return this.fallbackParser.parse();
        }
    }
}

export default AIPreferenceParser;
