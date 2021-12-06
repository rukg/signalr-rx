import { combineLatest, of } from 'rxjs';
import { createDefaultConnection, SignalRHub } from './signalr-hub';
import { TestScheduler } from 'rxjs/testing';

describe('SignalRHub', function () {
    const connection = createDefaultConnection('http://localhost:5000/hub-name');
    jest.spyOn(connection, 'start').mockImplementation(() => Promise.resolve());
    const hub = new SignalRHub(connection);

    let scheduler: TestScheduler;

    beforeEach(
        () =>
            (scheduler = new TestScheduler((actual, expected) => {
                expect(actual).toEqual(expected);
            })),
    );

    describe('on', function () {
        const on = jest.spyOn(hub, 'on').mockImplementation(() => of('event-payload'));

        it('should be create one subject for duplicate event names', () => {
            scheduler.run(({ expectObservable }) => {
                const s1$ = hub.on<string>('test-event');
                const s2$ = hub.on<string>('test-event');

                const combined$ = combineLatest([s1$, s2$]);
                const expectedMarble = '(a|)';
                const expectedEvents = { a: ['event-payload', 'event-payload'] };

                expectObservable(combined$).toBe(expectedMarble, expectedEvents);
            });
        });
    });
});
