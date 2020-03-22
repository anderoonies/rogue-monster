import React from "react";
import {
    DIM_THRESHOLD,
    DARK_THRESHOLD,
    DARKNESS_MAX,
    COLORS
} from "./constants";

const letters = {
    floor: ",",
    rock: "#",
    wall: "#",
    player: "x"
};

export default function Cell({
    type,
    letter,
    color,
    debugLetter,
    light,
    memory,
    row,
    col,
    debug,
    importantRooms
}) {
    let bgColor;
    let fgColor;
    if (color.type === 'rgb') {
        bgColor = `rgb(${color.bg.r}, ${color.bg.g}, ${color.bg.b})`
        fgColor = `rgb(${color.fg.r}, ${color.fg.g}, ${color.fg.b})`
    } else {
        bgColor = color.bg;
        fgColor = color.fg;
    }
    // if (memory && light === DARKNESS_MAX) {
    //     type = memory.type;
    //     letter = memory.type;
    //     bgColor = shadeHexColor(color, 30);
    // }
    return (
        <div
            onContextMenu={e => {
                e.preventDefault();
                return false;
            }}
            className={`cell ${type}`}
            key={`row${row}col${col}`}
            row={row}
            col={col}
            style={{
                backgroundColor: bgColor,
                color: fgColor,
                cursor: "crosshair"
            }}
            light={light}
            type={type}
        >
            {letter || letters[type]}
        </div>
    );
}

const shadeHexColor = (color, darkness) => {
    const decimal = Math.round((darkness / DARKNESS_MAX) * 6) / 6;
    const f = parseInt(color.slice(1), 16);
    // const t = percent < 0 ? 0 : 255;
    // const p = percent < 0 ? percent * -1 : percent;
    const componentToHex = c => {
        const hex = c.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    };

    const R = f >> 16;
    const G = (f >> 8) & 0x00ff;
    const B = f & 0x0000ff;
    return (
        "#" +
        componentToHex(
            Math.max(0, Math.min(Math.round(R - R * decimal, 2), 255))
        ) +
        componentToHex(
            Math.max(0, Math.min(Math.round(G - G * decimal, 2), 255))
        ) +
        componentToHex(
            Math.max(0, Math.min(Math.round(B - B * decimal, 2), 255))
        )
    );
};
