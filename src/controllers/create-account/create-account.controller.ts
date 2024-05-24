import {
  InternalServerErrorException,
  ConflictException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UsePipes,
} from '@nestjs/common'
import { hash } from 'bcryptjs'
import { ZodValidationPipe } from 'src/pipes/validation-pipe'
import { PrismaService } from 'src/prisma/prisma.service'
import { z } from 'zod'

const createAccountBodySchema = z.object({
  name: z.string().min(3, 'Insira um nome com pelo menos 3 digitos.'),
  email: z.string().email('Insira um email.'),
  password: z.string().min(4, 'Insira uma senha com pelo menos 4 digitos.'),
})

type CreateAccountBodySchema = z.infer<typeof createAccountBodySchema>

@Controller('/accounts')
export class CreateAccountController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createAccountBodySchema))
  async createUser(@Body() body: CreateAccountBodySchema) {
    const { name, email, password } = body

    const userWithSameEmail = await this.prisma.user.findUnique({
      where: {
        email,
      },
    })

    if (userWithSameEmail) {
      throw new ConflictException(
        'Um usuário com este email já está cadastrado!',
      )
    }

    const hashedPassword = await hash(password, 8)

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    if (!user) {
      throw new InternalServerErrorException('Erro ao cadastrar o usuário')
    }

    return `User created ${user.id}`
  }

  @Get()
  async getUser() {
    const user = await this.prisma.user.findMany()

    if (!user) {
      return 'Erro ao acessar a tabela no banco de dados.'
    }

    return user
  }
}
