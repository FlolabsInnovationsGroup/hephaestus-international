import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildMergeTimeEntryReattributePlan,
  collectMergeTimeEntrySourceIds,
  expandTimeEntryOwnerIds,
  isMergeTimeEntrySourceStatus,
} from './merge-time-entries';

describe('isMergeTimeEntrySourceStatus', () => {
  it('treats joined and post-joined pipeline statuses as chronos entry sources', () => {
    for (const status of ['joined', 'approved', 'graduated', 'terminated']) {
      assert.equal(isMergeTimeEntrySourceStatus(status), true);
      assert.equal(isMergeTimeEntrySourceStatus(status.toUpperCase()), true);
    }
  });

  it('excludes pre-joined and rejected statuses', () => {
    for (const status of ['applying', 'waiting', 'signed', 'rejected', 'closed', '']) {
      assert.equal(isMergeTimeEntrySourceStatus(status), false);
    }
  });
});

describe('collectMergeTimeEntrySourceIds', () => {
  const canonicalId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const joinedSecondary = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const applyingSecondary = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  const approvedSecondary = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

  it('includes only non-canonical leads at or past joined', () => {
    const ids = collectMergeTimeEntrySourceIds(
      [
        { id: canonicalId, status: 'applying' },
        { id: joinedSecondary, status: 'joined' },
        { id: applyingSecondary, status: 'applying' },
        { id: approvedSecondary, status: 'approved' },
      ],
      canonicalId,
    );
    assert.deepEqual(ids.sort(), [approvedSecondary, joinedSecondary].sort());
  });

  it('never includes the canonical lead even when canonical is joined', () => {
    const ids = collectMergeTimeEntrySourceIds(
      [
        { id: canonicalId, status: 'joined' },
        { id: joinedSecondary, status: 'joined' },
      ],
      canonicalId,
    );
    assert.deepEqual(ids, [joinedSecondary]);
  });
});

describe('expandTimeEntryOwnerIds', () => {
  const canonical = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const secondary = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const legacyUser = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

  it('adds legacy entry user ids and deduplicates', () => {
    const expanded = expandTimeEntryOwnerIds(
      [secondary, secondary],
      canonical,
      [legacyUser, legacyUser],
    );
    assert.deepEqual(expanded.sort(), [legacyUser, secondary].sort());
  });

  it('drops the canonical id if it appears in legacy ids', () => {
    const expanded = expandTimeEntryOwnerIds([secondary], canonical, [canonical, legacyUser]);
    assert.deepEqual(expanded.sort(), [legacyUser, secondary].sort());
  });
});

describe('buildMergeTimeEntryReattributePlan', () => {
  const canonical = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const joinedSecondary = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const legacyUser = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

  it('skips reattribution when no joined+ secondaries exist', () => {
    const plan = buildMergeTimeEntryReattributePlan({
      canonicalLeadId: canonical,
      leads: [
        { id: canonical, status: 'joined' },
        { id: joinedSecondary, status: 'applying' },
      ],
    });
    assert.equal(plan.shouldRun, false);
    assert.deepEqual(plan.sourceOwnerIds, []);
  });

  it('plans legacy user_id expansion for pre-unification entries', () => {
    const plan = buildMergeTimeEntryReattributePlan({
      canonicalLeadId: canonical,
      leads: [
        { id: canonical, status: 'applying' },
        { id: joinedSecondary, status: 'joined' },
      ],
      legacyEntryUserIds: [legacyUser],
    });
    assert.equal(plan.shouldRun, true);
    assert.equal(plan.canonicalUserId, canonical);
    assert.deepEqual(plan.sourceOwnerIds.sort(), [joinedSecondary, legacyUser].sort());
  });

  it('handles three-way merge with two joined secondaries', () => {
    const secondJoined = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
    const plan = buildMergeTimeEntryReattributePlan({
      canonicalLeadId: canonical,
      leads: [
        { id: canonical, status: 'waiting' },
        { id: joinedSecondary, status: 'joined' },
        { id: secondJoined, status: 'terminated' },
        { id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', status: 'signed' },
      ],
    });
    assert.equal(plan.shouldRun, true);
    assert.deepEqual(plan.sourceOwnerIds.sort(), [joinedSecondary, secondJoined].sort());
  });
});
