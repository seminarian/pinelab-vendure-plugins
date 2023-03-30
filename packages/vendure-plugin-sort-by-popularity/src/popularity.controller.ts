import { Controller, Get, Param } from '@nestjs/common';
import { Mutation } from '@nestjs/graphql';
import { Ctx, RequestContext } from '@vendure/core';
import { SortService } from './sort.service';
@Controller('/order-by-popularity')
export class OrderByPopularityController {
  constructor(private sortService: SortService) {}
  @Get('calculate-scores/:mychanneltoken')
  @Mutation()
  async calculateScores(
    @Ctx() ctx: RequestContext,
    @Param('mychanneltoken') token: string
  ) {
    await this.sortService.addScoreCalculatingJobToQueue(token, ctx);
  }
}
