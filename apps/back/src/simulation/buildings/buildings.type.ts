import { Citizen } from '../citizen/citizen'
import { Resource } from '../resource'

export interface Building {
  capacity?: number
  residents?: Citizen[]
  resources?: Resource[]
}