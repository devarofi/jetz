/**
 * Session-scoped key/value store backed by sessionStorage.
 * Install it with `Jetz.use(session)` to expose it as `$session`,
 * or create a standalone proxy with `sessionOf(data)`.
 */
export class JetzSession {
    session_id = 'app_session';

    dataProxy;
    savedData;

    get(key, def = null) {
        if (this.savedData != null && Object.prototype.hasOwnProperty.call(this.savedData, key))
            return this.savedData[key];
        return this[key] ?? def;
    }
    has(key) {
        return this.savedData != null && Object.prototype.hasOwnProperty.call(this.savedData, key);
    }
    set(key, value) {
        if (this.savedData == null) this.savedData = {};
        this.savedData[key] = value;
        this.save();
        return true;
    }
    setInitialData(data) {
        const oldData = sessionStorage.getItem(this.session_id);
        if (oldData) {
            try {
                this.savedData = JSON.parse(oldData);
            } catch (e) {
                // corrupted stored session: fall back to initial data
                this.savedData = data;
                this.save();
            }
        } else {
            this.savedData = data;
            this.save();
        }
    }
    destroy() {
        sessionStorage.removeItem(this.session_id);
        this.savedData = {};
    }
    save() {
        try {
            sessionStorage.setItem(this.session_id, JSON.stringify(this.savedData));
        } catch (e) { /* storage unavailable or full */ }
    }

    constructor(data = {}) {
        this.setInitialData(data);
        this.dataProxy = new Proxy(this, {
            get(target, prop) {
                return target.get(prop);
            },
            set(target, prop, value) {
                return target.set(prop, value);
            }
        });
    }

    install(context) {
        context.$session = this.dataProxy;
    }
}

export function sessionOf(data) {
    return (new JetzSession(data)).dataProxy;
}