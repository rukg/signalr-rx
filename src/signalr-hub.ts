import {HubConnection, HubConnectionBuilder} from '@microsoft/signalr';
import {combineLatest, defer, Observable, Subject} from 'rxjs';
import {map, mapTo, shareReplay} from 'rxjs/operators';

type Connection = HubConnection | string;
type SubjectsMap = { [key: string]: Subject<unknown> };

export class SignalRHub {

    private readonly subjects: SubjectsMap;
    private readonly connection: HubConnection;

    readonly start$ = defer(() => this.connection.start())
        .pipe(
            mapTo(true),
            shareReplay(1)
        );

    constructor(connection: Connection) {
        this.connection = connection instanceof HubConnection ? connection : createDefaultConnection(connection);
        this.subjects = {};
    }

    on<T>(eventName: string): Observable<T> {
        const subject = this.ensureEventSubject<T>(eventName);
        this.connection.on(eventName, (data: T) => subject.next(data));
        return subject.asObservable();
    }

    stream<T>(event: string): Observable<T> {
        return combineLatest([this.start$, this.on<T>(event)]).pipe(
            map(([_, value]: [boolean, T]) => value));
    }

    private ensureEventSubject<T>(eventName: string): Subject<T> {
        return (this.subjects[eventName] as Subject<T>) ??= new Subject<T>();
    }

}

export function createDefaultConnection(url: string): HubConnection {
    return new HubConnectionBuilder()
        .withUrl(url)
        .build();
}
