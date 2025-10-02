import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'

export interface UserProps {
  cpf: string
  password: string
  role: 'admin' | 'deliveryman' | 'recipient'
  name: string
  email?: string | null
  phone?: string | null
  status: 'active' | 'inactive'
  createdAt: Date
  updatedAt?: Date | null
}

export class User extends Entity<UserProps> {
  get cpf() {
    return this.props.cpf ?? null
  }

  get password() {
    return this.props.password
  }

  get role() {
    return this.props.role
  }

  get name() {
    return this.props.name
  }

  get email() {
    return this.props.email ?? null
  }

  get phone() {
    return this.props.phone ?? null
  }

  get status() {
    return this.props.status
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  private touch() {
    this.props.updatedAt = new Date()
  }

  set password(password: string) {
    this.props.password = password
    this.touch()
  }

  set name(name: string) {
    this.props.name = name
    this.touch()
  }

  set email(email: string | null) {
    this.props.email = email
    this.touch()
  }

  set phone(phone: string | null) {
    this.props.phone = phone
    this.touch()
  }

  set status(status: 'active' | 'inactive') {
    this.props.status = status
    this.touch()
  }

  static create(
    props: Optional<
      UserProps,
      'createdAt' | 'updatedAt' | 'email' | 'phone' | 'status'
    >,
    id?: UniqueEntityID,
  ) {
    const user = new User(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        status: props.status ?? 'active',
      },
      id,
    )

    return user
  }
}
