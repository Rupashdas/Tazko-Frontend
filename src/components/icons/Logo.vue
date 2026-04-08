<template>
    <svg height=200 viewBox="0 0 600 200"width=600 xmlns=http://www.w3.org/2000/svg>
        <defs>
            <linearGradient id=blueGradient x1=0% x2=100% y1=0% y2=100%>
                <stop offset=0% stop-color=#4F6BFF />
                <stop offset=100% stop-color=#2A3BFF />
            </linearGradient>
        </defs>
        <rect fill=url(#blueGradient) height=180 rx=40 width=180 x=10 y=10 />
        <path d="M60 100 L95 135 L150 65"fill=none stroke=white stroke-linecap=round stroke-linejoin=round stroke-width=18 />
        <text font-family="Poppins, Arial, sans-serif"font-size=129 font-weight=600 x=220 y=145>Tazko</text>
    </svg>
</template>
<style scoped>
    svg text{
        fill: var(--color-heading)
    }
</style>