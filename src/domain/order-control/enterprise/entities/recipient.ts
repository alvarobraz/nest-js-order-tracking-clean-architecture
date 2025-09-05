import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'

export interface RecipientProps {
  name: string
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  phone: string
  email: string
  createdAt: Date
  updatedAt?: Date
}

export class Recipient extends Entity<RecipientProps> {
  get name() {
    return this.props.name
  }

  get street() {
    return this.props.street
  }

  get number() {
    return this.props.number
  }

  get neighborhood() {
    return this.props.neighborhood
  }

  get city() {
    return this.props.city
  }

  get state() {
    return this.props.state
  }

  get zipCode() {
    return this.props.zipCode
  }

  get phone() {
    return this.props.phone
  }

  get email() {
    return this.props.email
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

  set name(name: string) {
    this.props.name = name
    this.touch()
  }

  set street(street: string) {
    this.props.street = street
    this.touch()
  }

  set number(number: string) {
    this.props.number = number
    this.touch()
  }

  set neighborhood(neighborhood: string) {
    this.props.neighborhood = neighborhood
    this.touch()
  }

  set city(city: string) {
    this.props.city = city
    this.touch()
  }

  set state(state: string) {
    this.props.state = state
    this.touch()
  }

  set zipCode(zipCode: string) {
    this.props.zipCode = zipCode
    this.touch()
  }

  set phone(phone: string) {
    this.props.phone = phone
    this.touch()
  }

  set email(email: string) {
    this.props.email = email
    this.touch()
  }

  static create(
    props: Optional<RecipientProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ) {
    const recipient = new Recipient(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )

    return recipient
  }
}
