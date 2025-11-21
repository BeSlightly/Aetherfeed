export const formatDate = (timestampInput: number | string): string => {
    if (!timestampInput) return "N/A";

    let timestampMillis = 0;
    const num = Number(timestampInput);

    if (isNaN(num) || num === 0) return "N/A";

    const sNum = String(Math.floor(Math.abs(num)));

    // Heuristic: if it's likely already milliseconds (e.g., 13+ digits, or a very large number for seconds)
    if (sNum.length >= 12 || num > 40000000000) {
        timestampMillis = num;
    } else {
        // Heuristic: if it's likely seconds (e.g., 10 digits like typical Unix epoch in seconds)
        timestampMillis = num * 1000;
    }

    const nowMillis = new Date().getTime();
    let seconds = Math.floor((nowMillis - timestampMillis) / 1000);
    let prefix = "";
    let suffix = " ago";

    if (seconds < 0) {
        // Future timestamp
        seconds = Math.abs(seconds);
        prefix = "in ";
        suffix = "";
    }

    if (seconds < 5 && prefix === "") return "just now";
    if (seconds < 60) return `${prefix}${Math.floor(seconds)}s${suffix}`;

    let interval = Math.floor(seconds / 60);
    if (interval < 60) return `${prefix}${interval}m${suffix}`;

    interval = Math.floor(seconds / 3600);
    if (interval < 24) return `${prefix}${interval}h${suffix}`;

    interval = Math.floor(seconds / 86400);
    if (interval < 30) return `${prefix}${interval}d${suffix}`;

    interval = Math.floor(seconds / 2592000);
    if (interval < 12) return `${prefix}${interval}mo${suffix}`;

    interval = Math.floor(seconds / 31536000);
    return `${prefix}${interval}yr${suffix}`;
};
