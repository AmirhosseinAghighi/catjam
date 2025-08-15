import * as assert from "assert";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { Core } from "../core";
import { Store, SettingKeys, CalculationType } from "../store";

suite("Core Tests", () => {
  let core: Core;
  let store: Store;
  let mockContext: any;
  let clock: sinon.SinonFakeTimers;

  setup(() => {
    // Reset singleton for testing
    (Core as any).instance = undefined;

    mockContext = {
      globalState: {
        get: sinon.stub(),
        update: sinon.stub().resolves(),
      },
    };

    store = new Store(mockContext);
    sinon.stub(store, "getSetting").returns(CalculationType.WPM);
    sinon.stub(store, "addComputedValueToAverage").returns(50);
    sinon.stub(store, "getValueAverage").returns(45);

    core = Core.getInstance(store);

    // Mock time for consistent testing
    clock = sinon.useFakeTimers(new Date("2024-01-01T00:00:00Z"));
  });

  teardown(() => {
    sinon.restore();
    clock.restore();
  });

  test("should create singleton instance", () => {
    const core1 = Core.getInstance(store);
    const core2 = Core.getInstance(store);
    assert.strictEqual(core1, core2);
  });

  test("should track single character typing", () => {
    core.keyPressed("a");

    const result = core.updateStates();
    assert.ok(result);
    assert.ok(result.typingData.value >= 0);
    assert.strictEqual(result.typingData.name, CalculationType.WPM);
  });

  test("should ignore special characters in single character typing", () => {
    core.keyPressed("\n");
    core.keyPressed("\t");
    core.keyPressed(" ");

    const result = core.updateStates();
    assert.ok(result);
    // Should not have started a session since no valid characters were typed
    assert.strictEqual(result.paused, true);
    assert.strictEqual(result.typingData.value, 0);
  });

  test("should handle multi-character pasted text", () => {
    const pastedText = "Hello World! This is a test.";
    core.keyPressed(pastedText);

    // Advance time slightly to establish session
    clock.tick(500);

    const result = core.updateStates();
    assert.ok(result);
    assert.ok(result.typingData.value >= 0);
  });

  test("should track deleted characters and calculate back ratio", () => {
    // Type some characters first
    core.keyPressed("hello");
    core.keyPressed("world");

    // Delete some characters
    core.textDeleted(3);

    const result = core.updateStates();
    assert.ok(result);
    assert.ok(result.backRatio > 0);
    // Back ratio should be 3 deleted out of 10 total characters
    assert.strictEqual(result.backRatio, 3 / 10);
  });

  test("should calculate video speed based on typing speed", () => {
    // Type some characters to generate a typing speed
    for (let i = 0; i < 50; i++) {
      core.keyPressed("a");
    }

    clock.tick(30000); // 30 seconds

    const result = core.updateStates();
    assert.ok(result);
    assert.strictEqual(typeof result.videoSpeed, "number");
    assert.ok(result.videoSpeed >= 0);
    assert.ok(result.videoSpeed <= 2); // Video speed should be capped at 2x
  });

  test("should return zero video speed when no typing occurs", () => {
    const result = core.updateStates();
    assert.ok(result);
    assert.strictEqual(result.videoSpeed, 0);
    assert.strictEqual(result.paused, true);
  });

  test("should handle session lifecycle correctly", () => {
    // Start typing to begin session
    core.keyPressed("test");

    // First update - check if session behavior is working
    let result = core.updateStates();
    assert.ok(result);
    // Session might start as paused initially, let's check the actual behavior
    // If paused is true initially, the session hasn't started yet
    const initialPausedState = result.paused;

    // Advance time beyond session threshold
    clock.tick(3000); // 3 seconds

    // Session should end due to inactivity
    result = core.updateStates();
    assert.ok(result);
    assert.strictEqual(result.paused, true);
  });
  test("should reset session data when session ends", () => {
    // Start a session and type some characters
    core.keyPressed("hello");
    core.textDeleted(1);

    let result = core.updateStates();
    assert.ok(result);
    assert.ok(result.backRatio > 0);

    // Wait for session to end
    clock.tick(3000);
    result = core.updateStates();
    assert.ok(result);
    assert.strictEqual(result.paused, true);

    // Start new session - back ratio should be reset
    core.keyPressed("a");
    result = core.updateStates();
    assert.ok(result);
    assert.strictEqual(result.backRatio, 0); // Should be reset
  });

  test("should handle destroy method correctly", () => {
    // Start typing session
    core.keyPressed("test");
    core.updateStates();

    // Destroy the core
    core.destroy();

    // Should return paused state
    const result = core.updateStates();
    assert.ok(result);
    assert.strictEqual(result.paused, true);
    assert.strictEqual(result.typingData.value, 0);
  });

  test("should handle negative WPM calculations", () => {
    // Type some characters
    for (let i = 0; i < 10; i++) {
      core.keyPressed("a");
    }

    // Delete more than typed (should not result in negative WPM)
    core.textDeleted(15);

    clock.tick(60000);

    const result = core.updateStates();
    assert.ok(result);
    assert.ok(result.typingData.value >= 0); // Should never be negative
  });

  test("should include average in typing data", () => {
    core.keyPressed("test");
    clock.tick(1000);

    const result = core.updateStates();
    assert.ok(result);
    assert.strictEqual(typeof result.typingData.average, "number");
    assert.strictEqual(result.typingData.average, 45); // Mocked return value
  });
});
