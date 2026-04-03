import { ValidationPipe } from '@nestjs/common';
import { IsString, IsNumber, IsOptional } from 'class-validator';
import { plainToInstance } from 'class-transformer';

class SampleDto {
  @IsString()
  name: string;

  @IsNumber()
  age: number;

  @IsOptional()
  @IsString()
  nickname?: string;
}

describe('ValidationPipe Configuration', () => {
  let pipe: ValidationPipe;

  beforeEach(() => {
    pipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    });
  });

  it('should be configured with transform, whitelist, and forbidNonWhitelisted', () => {
    expect(pipe).toBeInstanceOf(ValidationPipe);
  });

  it('should transform and validate a valid DTO', async () => {
    const input = { name: 'John', age: 30 };
    const result = (await pipe.transform(plainToInstance(SampleDto, input), {
      type: 'body',
      metatype: SampleDto,
      data: '',
    })) as SampleDto;

    expect(result).toBeInstanceOf(SampleDto);
    expect(result.name).toBe('John');
    expect(result.age).toBe(30);
  });

  it('should reject DTO with invalid field types', async () => {
    const input = { name: 'John', age: 'not-a-number' };

    await expect(
      pipe.transform(plainToInstance(SampleDto, input), {
        type: 'body',
        metatype: SampleDto,
        data: '',
      }),
    ).rejects.toThrow();
  });

  it('should strip non-whitelisted properties from DTOs without forbidNonWhitelisted', async () => {
    const lenientPipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    });

    const input = { name: 'John', age: 30, extraField: 'should be removed' };
    const result = (await lenientPipe.transform(
      plainToInstance(SampleDto, input),
      {
        type: 'body',
        metatype: SampleDto,
        data: '',
      },
    )) as SampleDto;

    expect(result).toBeInstanceOf(SampleDto);
    expect((result as Record<string, unknown>).extraField).toBeUndefined();
  });

  it('should reject DTO with non-whitelisted properties when forbidNonWhitelisted is true', async () => {
    const input = { name: 'John', age: 30, hackerField: 'bad' };

    await expect(
      pipe.transform(plainToInstance(SampleDto, input), {
        type: 'body',
        metatype: SampleDto,
        data: '',
      }),
    ).rejects.toThrow();
  });

  it('should reject DTO with missing required fields', async () => {
    const input = { age: 30 };

    await expect(
      pipe.transform(plainToInstance(SampleDto, input), {
        type: 'body',
        metatype: SampleDto,
        data: '',
      }),
    ).rejects.toThrow();
  });
});
