import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { Order } from './order.entity';
import { OrderResponseDto } from './dto/order-response.dto';
import { HateoasResource } from '../../common/decorators/hateoas-resource.decorator';

@ApiTags('Orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @HateoasResource('order')
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or insufficient stock',
  })
  async create(@Body() dto: CreateOrderDto): Promise<Order> {
    return this.orderService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @HateoasResource('order')
  @ApiResponse({
    status: 200,
    description: 'List of orders',
    type: OrderResponseDto,
    isArray: true,
  })
  async findAll(): Promise<Order[]> {
    return this.orderService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order by ID' })
  @ApiParam({ name: 'id', type: Number })
  @HateoasResource('order')
  @ApiResponse({
    status: 200,
    description: 'Order found',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findById(@Param('id', ParseIntPipe) id: number): Promise<Order> {
    return this.orderService.findById(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiParam({ name: 'id', type: Number })
  @HateoasResource('order')
  @ApiResponse({
    status: 200,
    description: 'Order status updated',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ): Promise<Order> {
    return this.orderService.updateStatus(id, dto.str_status);
  }
}
