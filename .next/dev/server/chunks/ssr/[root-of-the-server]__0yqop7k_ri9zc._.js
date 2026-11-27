module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/dynamic-access-async-storage.external.js [external] (next/dist/server/app-render/dynamic-access-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/dynamic-access-async-storage.external.js", () => require("next/dist/server/app-render/dynamic-access-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/runtime-reacts.external.js [external] (next/dist/server/runtime-reacts.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/runtime-reacts.external.js", () => require("next/dist/server/runtime-reacts.external.js"));

module.exports = mod;
}),
"[project]/components/DynamicBackground.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DynamicBackground",
    ()=>DynamicBackground
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-themes/dist/index.mjs [app-ssr] (ecmascript)");
"use client";
;
;
;
const MAX_LINK_DISTANCE = 130;
const DESKTOP_NODE_COUNT = 40;
const MOBILE_NODE_COUNT = 20;
const MOBILE_BREAKPOINT = 768;
function createNodes(count, width, height) {
    const nodes = [];
    for(let i = 0; i < count; i++){
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.18 + Math.random() * 0.28;
        nodes.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 1.4 + Math.random() * 1.4,
            accent: i % 4 === 0
        });
    }
    return nodes;
}
function DynamicBackground() {
    const canvasRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const { resolvedTheme } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useTheme"])();
    const isDark = resolvedTheme !== "light";
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        const pointerQuery = window.matchMedia("(pointer: fine)");
        let width = window.innerWidth;
        let height = window.innerHeight;
        let dpr = Math.min(window.devicePixelRatio || 1, 2);
        let targetCount = width < MOBILE_BREAKPOINT ? MOBILE_NODE_COUNT : DESKTOP_NODE_COUNT;
        let nodes = createNodes(targetCount, width, height);
        let rafId = null;
        const mouse = {
            x: 0,
            y: 0,
            active: false
        };
        const resize = ()=>{
            width = window.innerWidth;
            height = window.innerHeight;
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const nextCount = width < MOBILE_BREAKPOINT ? MOBILE_NODE_COUNT : DESKTOP_NODE_COUNT;
            if (nextCount !== targetCount) {
                targetCount = nextCount;
                nodes = createNodes(targetCount, width, height);
            } else {
                for (const node of nodes){
                    if (node.x > width) node.x = Math.random() * width;
                    if (node.y > height) node.y = Math.random() * height;
                }
            }
        };
        const drawFrame = ()=>{
            ctx.clearRect(0, 0, width, height);
            const baseNodeColor = isDark ? "rgba(113, 113, 122, 0.45)" // zinc-500
             : "rgba(161, 161, 170, 0.45)"; // zinc-400
            const accentNodeColor = isDark ? "rgba(52, 211, 153, 0.55)" // emerald-400
             : "rgba(5, 150, 105, 0.45)"; // emerald-600
            // Draw connections between nearby nodes
            for(let i = 0; i < nodes.length; i++){
                const a = nodes[i];
                for(let j = i + 1; j < nodes.length; j++){
                    const b = nodes[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const distSq = dx * dx + dy * dy;
                    if (distSq < MAX_LINK_DISTANCE * MAX_LINK_DISTANCE) {
                        const dist = Math.sqrt(distSq);
                        const alpha = (1 - dist / MAX_LINK_DISTANCE) * (isDark ? 0.18 : 0.16);
                        ctx.strokeStyle = a.accent || b.accent ? isDark ? `rgba(52, 211, 153, ${alpha})` : `rgba(5, 150, 105, ${alpha})` : isDark ? `rgba(113, 113, 122, ${alpha})` : `rgba(161, 161, 170, ${alpha})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
                // Connect to desktop mouse cursor when within range
                if (mouse.active && width >= MOBILE_BREAKPOINT && pointerQuery.matches) {
                    const mdx = a.x - mouse.x;
                    const mdy = a.y - mouse.y;
                    const mDistSq = mdx * mdx + mdy * mdy;
                    if (mDistSq < MAX_LINK_DISTANCE * MAX_LINK_DISTANCE) {
                        const mDist = Math.sqrt(mDistSq);
                        const alpha = (1 - mDist / MAX_LINK_DISTANCE) * (isDark ? 0.3 : 0.25);
                        ctx.strokeStyle = isDark ? `rgba(52, 211, 153, ${alpha})` : `rgba(5, 150, 105, ${alpha})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(mouse.x, mouse.y);
                        ctx.stroke();
                    }
                }
            }
            // Draw nodes
            for (const node of nodes){
                ctx.fillStyle = node.accent ? accentNodeColor : baseNodeColor;
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        };
        const tick = ()=>{
            for (const node of nodes){
                node.x += node.vx;
                node.y += node.vy;
                if (node.x < 0) {
                    node.x = 0;
                    node.vx *= -1;
                } else if (node.x > width) {
                    node.x = width;
                    node.vx *= -1;
                }
                if (node.y < 0) {
                    node.y = 0;
                    node.vy *= -1;
                } else if (node.y > height) {
                    node.y = height;
                    node.vy *= -1;
                }
            }
            drawFrame();
            rafId = window.requestAnimationFrame(tick);
        };
        const startOrRenderStatic = ()=>{
            if (rafId !== null) {
                window.cancelAnimationFrame(rafId);
                rafId = null;
            }
            if (motionQuery.matches) {
                drawFrame();
            } else {
                rafId = window.requestAnimationFrame(tick);
            }
        };
        const handleMouseMove = (e)=>{
            if (window.innerWidth < MOBILE_BREAKPOINT || !pointerQuery.matches) {
                mouse.active = false;
                return;
            }
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            mouse.active = true;
        };
        const handleMouseLeave = ()=>{
            mouse.active = false;
        };
        const handleResize = ()=>{
            resize();
            if (motionQuery.matches) {
                drawFrame();
            }
        };
        resize();
        startOrRenderStatic();
        window.addEventListener("resize", handleResize);
        window.addEventListener("mousemove", handleMouseMove, {
            passive: true
        });
        window.addEventListener("mouseleave", handleMouseLeave);
        motionQuery.addEventListener("change", startOrRenderStatic);
        return ()=>{
            if (rafId !== null) {
                window.cancelAnimationFrame(rafId);
            }
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseleave", handleMouseLeave);
            motionQuery.removeEventListener("change", startOrRenderStatic);
        };
    }, [
        isDark
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        "aria-hidden": "true",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "animate-drift-a absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/15 sm:h-[34rem] sm:w-[34rem]"
            }, void 0, false, {
                fileName: "[project]/components/DynamicBackground.tsx",
                lineNumber: 244,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "animate-drift-b absolute -bottom-28 -right-24 h-[28rem] w-[28rem] rounded-full bg-sky-400/15 blur-3xl dark:bg-teal-500/15 sm:h-[36rem] sm:w-[36rem]"
            }, void 0, false, {
                fileName: "[project]/components/DynamicBackground.tsx",
                lineNumber: 245,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                ref: canvasRef,
                className: "block h-full w-full"
            }, void 0, false, {
                fileName: "[project]/components/DynamicBackground.tsx",
                lineNumber: 248,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/DynamicBackground.tsx",
        lineNumber: 239,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/ThemeProvider.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ThemeProvider",
    ()=>ThemeProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-themes/dist/index.mjs [app-ssr] (ecmascript)");
"use client";
;
;
function ThemeProvider({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ThemeProvider"], {
        attribute: "class",
        defaultTheme: "dark",
        enableSystem: false,
        disableTransitionOnChange: true,
        children: children
    }, void 0, false, {
        fileName: "[project]/components/ThemeProvider.tsx",
        lineNumber: 8,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0yqop7k_ri9zc._.js.map