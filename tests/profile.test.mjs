import test from 'node:test';import assert from 'node:assert/strict';
import {PROFILES,expectedMembership,replaceSeed} from '../scripts/profile.mjs';
test('profile plan membership count matches measurements',()=>{
 assert.equal(PROFILES.profile.PLANS,14372);
 assert.equal(PROFILES.profile.DEMANDS,213445);
 assert.equal(expectedMembership('profile'),145839);
 assert.equal(PROFILES.profile.MISSION_REF_PLANS+PROFILES.profile.DOUBLE_MISSION_PLANS,15050);
 assert.equal(PROFILES.profile.PLANS-PROFILES.profile.ACTIVE_PLANS,4990);
});
test('smoke uses smaller counts and all placeholders are substituted',()=>{
 assert.ok(PROFILES.smoke.DEMANDS<PROFILES.profile.DEMANDS);
 assert.equal(replaceSeed('select __DEMANDS__ as count;', 'smoke'),'select 3000 as count;');
 assert.throws(()=>replaceSeed('__BAD_NAME__','profile'));
});
