// 라우트 핸들러를 실제 NextRequest 로 직접 부른다 (서버를 띄우지 않고)
import { beforeEach, describe, expect, it } from 'vitest';
import * as sensors from '../app/api/sensors/route';
import * as emergency from '../app/api/emergency/route';
import * as floors from '../app/api/floors/route';
import { anonymous, freshEnv, terminal, TEST_OTP } from './helpers';

beforeEach(freshEnv);

const raiseAlarm = (req: ReturnType<typeof terminal>) =>
  sensors.PUT(req('/api/sensors', { method: 'PUT', body: { id: 'sensor-ev-smoke', status: 'ALARM', value: 80 } }));

describe('인증', () => {
  it('로그인 없이는 401', async () => {
    expect((await sensors.GET(anonymous('/api/sensors'))).status).toBe(401);
    expect((await emergency.POST(anonymous('/api/emergency', { method: 'POST', body: { action: 'REVOKE' } }))).status).toBe(401);
  });
});

describe('/api/sensors', () => {
  it('깨진 JSON 은 400, 없는 센서는 404, 같은 id 는 409', async () => {
    const req = terminal();
    expect((await sensors.POST(req('/api/sensors', { method: 'POST', raw: '{bad' }))).status).toBe(400);
    expect((await sensors.DELETE(req('/api/sensors?id=nope', { method: 'DELETE' }))).status).toBe(404);
    const body = { id: 'sensor-x', type: 'CCTV', floorId: '1F', x: 1, y: 1, status: 'NORMAL' };
    expect((await sensors.POST(req('/api/sensors', { method: 'POST', body }))).status).toBe(201);
    expect((await sensors.POST(req('/api/sensors', { method: 'POST', body }))).status).toBe(409);
  });

  it('없는 floorId 조회는 400', async () => {
    expect((await sensors.GET(terminal()('/api/sensors?floorId=ZZZ'))).status).toBe(400);
  });

  it('EV 연기 경보는 B2 자동 전환 신호를 준다', async () => {
    const json = await (await raiseAlarm(terminal())).json();
    expect(json.triggerAutoFloorChange).toBe('B2');
  });
});

describe('/api/floors', () => {
  it('센서가 없는 층은 NORMAL 이 아니라 UNMONITORED', async () => {
    const req = terminal();
    const list = (await (await sensors.GET(req('/api/sensors?floorId=B3'))).json()).data as { id: string }[];
    for (const s of list) await sensors.DELETE(req(`/api/sensors?id=${s.id}`, { method: 'DELETE' }));
    const b3 = (await (await floors.GET(req('/api/floors'))).json()).data.find((f: { id: string }) => f.id === 'B3');
    expect(b3.status).toBe('UNMONITORED');
  });
});

describe('/api/emergency', () => {
  it('경보가 없으면 맞는 OTP 도 409', async () => {
    const res = await emergency.POST(terminal()('/api/emergency', { method: 'POST', body: { otp: TEST_OTP } }));
    expect(res.status).toBe(409);
  });

  it('승인은 요청한 단말에만 — 다른 단말은 인명 정보를 못 받는다', async () => {
    const a = terminal();
    const b = terminal();
    await raiseAlarm(a);
    expect((await emergency.POST(a('/api/emergency', { method: 'POST', body: { otp: TEST_OTP } }))).status).toBe(200);
    const ga = await (await emergency.GET(a('/api/emergency'))).json();
    const gb = await (await emergency.GET(b('/api/emergency'))).json();
    expect(ga.approved).toBe(true);
    expect(ga.peopleCount).toBe(ga.occupants.length);
    expect(gb.approved).toBe(false);
    expect(gb.occupants).toBeUndefined();
  });

  it('오답 응답에 정답이 없고, 5번 틀리면 429', async () => {
    const a = terminal();
    await raiseAlarm(a);
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await emergency.POST(a('/api/emergency', { method: 'POST', body: { otp: '000000' } }));
      statuses.push(res.status);
      expect(JSON.stringify(await res.json())).not.toContain(TEST_OTP);
    }
    expect(statuses).toEqual([401, 401, 401, 401, 401, 429]);
    // 잠긴 동안은 맞는 OTP 도 받지 않는다
    expect((await emergency.POST(a('/api/emergency', { method: 'POST', body: { otp: TEST_OTP } }))).status).toBe(429);
  });

  it('OTP 형식이 틀리면 400', async () => {
    const res = await emergency.POST(terminal()('/api/emergency', { method: 'POST', body: { otp: { $ne: '' } } }));
    expect(res.status).toBe(400);
  });
});
