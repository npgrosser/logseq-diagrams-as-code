export function dedent(str: string) {
    // thanks https://codepen.io/gskinner/pen/BVEzox
    str = str.replace(/^\n/, "");
    let match = str.match(/^\s+/);
    return match ? str.replace(new RegExp("^" + match[0], "gm"), "") : str;
}

export function urlSafeBase64(str: string) {
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_")
}