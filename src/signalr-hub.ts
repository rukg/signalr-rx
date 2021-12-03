import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { combineLatest, defer, Observable, Subject } from 'rxjs';
import { map, mapTo, shareReplay } from 'rxjs/operators';

type Protocol = 'http' | 'https';
type ConnectionString = `${Protocol}${string}`;
type Connection = HubConnection | ConnectionString;
type SubjectsMap = { [key: string]: Subject<unknown> };

export class SignalRHub {
    private readonly subjects: SubjectsMap;
    private readonly connection: HubConnection;

    public readonly connect$: Observable<boolean> = defer(() => this.connection.start()).pipe(
        mapTo(true),
        shareReplay({ refCount: true, bufferSize: 1 }),
    );

    constructor(connection: Connection) {
        this.connection =
            connection instanceof HubConnection ? connection : createDefaultConnection(connection);

        this.subjects = {};
    }

    public on<T>(event: string): Observable<T> {
        const subject = this.ensureEventSubject<T>(event);
        this.connection.on(event, (data: T) => subject.next(data));
        return subject.asObservable();
    }

    public stream<T>(event: string): Observable<T> {
        return combineLatest([this.connect$, this.on<T>(event)]).pipe(
            map(([_, value]: [boolean, T]) => value),
        );
    }

    private ensureEventSubject<T>(eventName: string): Subject<T> {
        return ((this.subjects[eventName] as Subject<T>) ??= new Subject<T>());
    }
}

export function createDefaultConnection(url: string): HubConnection {
    return new HubConnectionBuilder()
        .withUrl(url)
        .withAutomaticReconnect()
        .build();
}
