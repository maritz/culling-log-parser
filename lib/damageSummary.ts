class DamageSubSummary implements CullingParser.IDamageSummaryDamage {

  public amount: number;
  public count: number;
  public averageRange: number;
  public rangeSum: number;
  public backstabCount: number;
  public headshotCount: number;
  public meleeBlockCount: number;
  public rangeBlockCount: number;
  public rangeBlockAmount: number;

  constructor() {
    this.amount = 0;
    this.averageRange = 0;
    this.count = 0;
    this.rangeSum = 0;
    this.backstabCount = 0;
    this.meleeBlockCount = 0;
    this.rangeBlockCount = 0;
    this.rangeBlockAmount = 0;
  }

  public addDamage(damage = 0, instance: CullingParser.IDamageInstance) {
    if (!instance.isBlocked) {
      this.count++;
      this.amount += damage;
    }
    this.rangeSum += instance.range;
    if (this.count > 0) {
      this.averageRange = this.rangeSum / this.count;
    }
    if (instance.isBackstab) {
      this.backstabCount++;
    }
    if (instance.block > 0) {
      if (!instance.isRanged) {
        this.meleeBlockCount++;
      } else {
        this.rangeBlockAmount += damage * (instance.block / 100);
        this.rangeBlockCount++;
      }
    }
  }

  public addOtherSubSummary(other: DamageSubSummary): DamageSubSummary {
    const result = new DamageSubSummary();
    result.amount = this.amount + other.amount;
    result.count = this.count + other.count;
    if (this.count > 0 || other.count > 0) {
      result.averageRange = (this.rangeSum + other.rangeSum) / (this.count + other.count);
    } else {
      result.averageRange = 0;
    }
    result.backstabCount = this.backstabCount + other.backstabCount;
    result.meleeBlockCount = this.meleeBlockCount + other.meleeBlockCount;
    result.rangeBlockAmount = this.rangeBlockAmount + other.rangeBlockAmount;
    result.rangeBlockCount = this.rangeBlockCount + other.rangeBlockCount;
    return result;
  }
}

export default class DamageSummary {

  private summaries: {
      afk: {
        dealt: DamageSubSummary,
        received: DamageSubSummary,
      }
      melee: {
        dealt: DamageSubSummary,
        received: DamageSubSummary,
      },
      ranged: {
        dealt: DamageSubSummary,
        received: DamageSubSummary,
      },
  };


  constructor() {
    this.summaries = {
      afk: {
        dealt: new DamageSubSummary(),
        received: new DamageSubSummary(),
      },
      melee: {
        dealt: new DamageSubSummary(),
        received: new DamageSubSummary(),
      },
      ranged: {
        dealt: new DamageSubSummary(),
        received: new DamageSubSummary(),
      },
    };
  }

  public add(instance: CullingParser.IDamageInstance) {
    let obj = this.summaries.melee;
    if (instance.isRanged) {
      if (instance.isAFK) {
        obj = this.summaries.afk;
      } else {
        obj = this.summaries.ranged;
      }
    }

    let subSUmmary = obj.dealt;
    let damage = instance.dealt;
    if (instance.received > 0) {
      subSUmmary = obj.received;
      damage = instance.received;
    }
    subSUmmary.addDamage(damage, instance);
  }

  public getSummary(): CullingParser.IDamageSummary {
    type averageRangeObject = {
      averageRange: number
    };
    type summariesObject = {
      melee: CullingParser.IDamageSummaryDealtAndReceived,
      ranged: CullingParser.IDamageSummaryDealtAndReceived,
      afk: CullingParser.IDamageSummaryDealtAndReceived
    };

    let totalDealt = this.summaries.melee.dealt.addOtherSubSummary(this.summaries.ranged.dealt);
    totalDealt = totalDealt.addOtherSubSummary(this.summaries.afk.dealt);

    let totalReceived = this.summaries.melee.received.addOtherSubSummary(this.summaries.ranged.received);
    totalReceived = totalReceived.addOtherSubSummary(this.summaries.afk.received);

    const count = totalDealt.count + totalReceived.count;
    const sum = totalDealt.rangeSum + totalReceived.rangeSum;


    const response = Object.assign<summariesObject, averageRangeObject, CullingParser.IDamageSummaryDealtAndReceived>(
      this.summaries,
      {
        averageRange: sum / count,
      },
      {
        dealt: totalDealt,
        received: totalReceived,
      }
    );

    return response;
  }
}
