import * as assert from "assert";
import * as sinon from "sinon";
import { Store, SettingKeys, CalculationType } from "../store";

suite("Store Tests", () => {
  let store: Store;
  let mockContext: any;

  setup(() => {
    mockContext = {
      globalState: {
        get: sinon.stub(),
        update: sinon.stub().resolves(),
      },
    };

    // Set up default returns for settings
    (mockContext.globalState.get as any)
      .withArgs(SettingKeys.CALCULATION_TYPE, CalculationType.WPM)
      .returns(CalculationType.WPM);
    (mockContext.globalState.get as any)
      .withArgs(SettingKeys.SHOW_BACK_RATIO, false)
      .returns(false);

    store = new Store(mockContext);
  });

  teardown(() => {
    sinon.restore();
  });

  test("should load default settings on creation", () => {
    assert.ok(
      (mockContext.globalState.get as any).calledWith(
        SettingKeys.CALCULATION_TYPE,
        CalculationType.WPM
      )
    );
    assert.ok(
      (mockContext.globalState.get as any).calledWith(
        SettingKeys.SHOW_BACK_RATIO,
        false
      )
    );
  });

  test("should return correct default calculation type", () => {
    const calculationType = store.getSetting<string>(
      SettingKeys.CALCULATION_TYPE
    );
    assert.strictEqual(calculationType, CalculationType.WPM);
  });

  test("should return correct default show back ratio setting", () => {
    const showBackRatio = store.getSetting<boolean>(
      SettingKeys.SHOW_BACK_RATIO
    );
    assert.strictEqual(showBackRatio, false);
  });

  test("should calculate average correctly with existing value", () => {
    // Mock existing average value
    (mockContext.globalState.get as any)
      .withArgs(CalculationType.WPM)
      .returns(50);

    const newAverage = store.addComputedValueToAverage(CalculationType.WPM, 60);

    // Should calculate (50 + 60) / 2 = 55
    assert.strictEqual(newAverage, 55);
    assert.ok(
      (mockContext.globalState.update as any).calledWith(
        CalculationType.WPM,
        55
      )
    );
  });

  test("should calculate average correctly with no existing value", () => {
    // Mock no existing value (undefined)
    (mockContext.globalState.get as any)
      .withArgs(CalculationType.KPM)
      .returns(undefined);

    const newAverage = store.addComputedValueToAverage(CalculationType.KPM, 80);

    // Should calculate (0 + 80) / 2 = 40
    assert.strictEqual(newAverage, 40);
    assert.ok(
      (mockContext.globalState.update as any).calledWith(
        CalculationType.KPM,
        40
      )
    );
  });

  test("should return stored average value", () => {
    (mockContext.globalState.get as any)
      .withArgs(CalculationType.WPM)
      .returns(65);

    const average = store.getValueAverage(CalculationType.WPM);

    assert.strictEqual(average, 65);
  });

  test("should return 0 for average when no value exists", () => {
    (mockContext.globalState.get as any)
      .withArgs(CalculationType.NCS)
      .returns(undefined);

    const average = store.getValueAverage(CalculationType.NCS);

    assert.strictEqual(average, 0);
  });

  test("should handle type safety for getSetting", () => {
    // Test string type
    const calculationType = store.getSetting<string>(
      SettingKeys.CALCULATION_TYPE
    );
    assert.strictEqual(typeof calculationType, "string");

    // Test boolean type
    const showBackRatio = store.getSetting<boolean>(
      SettingKeys.SHOW_BACK_RATIO
    );
    assert.strictEqual(typeof showBackRatio, "boolean");
  });
});
