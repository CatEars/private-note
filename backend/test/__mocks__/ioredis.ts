class Redis {
    private values: any = {}
    public constructorParams: any
    public calls: Array<any> = []

    constructor(options?: any) {
        this.constructorParams = options
    }

    set(key: string, value: any) {
        this.calls.push(['set', key, value])
        this.values[key] = value
    }

    exists(key: string): boolean {
        this.calls.push(['exists', key])
        return this.values.hasOwnProperty(key)
    }

    get(key: string): any {
        this.calls.push(['get', key])
        if (!this.exists(key)) {
            throw new Error('No such key')
        }
        return this.values[key]
    }

    disconnect() {
        this.calls.push(['disconnect'])
    }
}

export default Redis
