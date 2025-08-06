/// <reference types="vite/client" />

declare module '*.vtt' {
    const content: string;
    export default content;
}

declare module '*.vtt?raw' {
    const content: string;
    export default content;
}