class DamageSubSummary implements CullingParser.IDamageSummaryDamage {

  public amount: number;
  public count: number;
  public averageRange: number;
  public rangeSum: number;

  constructor() {
    this.amount = 0;
    this.averageRange = 0;
    this.count = 0;
    this.rangeSum = 0;
  }

  addDamage(damage = 0, range = 0) {
    this.count++;
    this.amount += damage;
    this.rangeSum += range;
    this.averageRange = this.rangeSum / this.count;
  }

  addOtherSubSummary(other: DamageSubSummary): DamageSubSummary {
    var result = new DamageSubSummary();
    result.amount = this.amount + other.amount;
    result.count = this.count + other.count;
    result.averageRange = (this.rangeSum + other.rangeSum) / (this.count + other.count);
    return result;
  }
}

export default class DamageSummary {

  private summaries: {
      melee: {
        dealt: DamageSubSummary,
        received: DamageSubSummary
      },
      ranged: {
        dealt: DamageSubSummary,
        received: DamageSubSummary
      },
      afk: {
        dealt: DamageSubSummary,
        received: DamageSubSummary
      }
  };


  constructor() {
    this.summaries = {
      melee: {
        dealt: new DamageSubSummary(),
        received: new DamageSubSummary()
      },
      ranged: {
        dealt: new DamageSubSummary(),
        received: new DamageSubSummary()
      },
      afk: {
        dealt: new DamageSubSummary(),
        received: new DamageSubSummary()
      }
    };
  }

  add(instance: CullingParser.IDamageInstance) {
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
    subSUmmary.addDamage(damage, instance.range);
  }

  getSummary(): CullingParser.IDamageSummary {
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
    totalReceived = totalDealt.addOtherSubSummary(this.summaries.afk.received);

    const count = totalDealt.count + totalReceived.count;
    const sum = totalDealt.rangeSum + totalReceived.rangeSum;


    const response = Object.assign<summariesObject, averageRangeObject, CullingParser.IDamageSummaryDealtAndReceived>(
      this.summaries,
      {
        averageRange: sum / count
      },
      {
        dealt: totalDealt,
        received: totalReceived
      }
    );

    return response;
  }
}
