// Generates single number pseudo hash.
// https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
export function hashString(input: string) {
    return input.split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
    }, 0);
}
