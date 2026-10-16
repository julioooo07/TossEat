const test = require('node:test');
const assert = require('node:assert/strict');
const { reservationSlots, getReservationWindow, isValidFlavorPair, calculateSubtotal } = require('../reservationRules');
const now = new Date('2026-10-16T01:00:00Z'); // 9:00 AM in Manila

test('reservation slots are every 15 minutes from 11:00 through 21:00', () => { assert.equal(reservationSlots[0], '11:00'); assert.equal(reservationSlots.at(-1), '21:00'); assert.equal(reservationSlots.length, 41); });
test('reservation window uses Manila local time and reserves two hours', () => { const { start, end } = getReservationWindow('2026-10-16','11:00',now); assert.equal(start.toISOString(),'2026-10-16T03:00:00.000Z'); assert.equal(end-start,120*60*1000); });
test('rejects past slots, invalid dates, and invalid time slots', () => { assert.throws(()=>getReservationWindow('2026-10-16','08:00',now)); assert.throws(()=>getReservationWindow('2026-02-30','11:00',now)); assert.throws(()=>getReservationWindow('2026-10-16','22:00',now)); });
test('each Unlimited Wings diner requires exactly two different active flavors', () => { const valid=new Set(['bbq','teriyaki','buffalo']); assert.equal(isValidFlavorPair(['bbq','teriyaki'],valid),true); assert.equal(isValidFlavorPair(['bbq'],valid),false); assert.equal(isValidFlavorPair(['bbq','bbq'],valid),false); assert.equal(isValidFlavorPair(['bbq','missing'],valid),false); });
test('subtotal uses server-trusted unit prices and quantities', () => { assert.equal(calculateSubtotal([{unitPrice:409,quantity:2},{unitPrice:70,quantity:1}]),888); });
