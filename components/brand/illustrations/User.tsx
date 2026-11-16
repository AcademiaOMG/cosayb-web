import { Rad, Svg, grad, useUid, type IllustrationProps } from "./kit"

const BODY =
  "M43 258C43 192 98 152 153 152C208 152 262 192 262 258C262 270 254 278 242 278L63 278C51 278 43 270 43 258Z"

/** Busto de usuario: cabeza esfera y torso en cúpula, volumen inflado. */
export default function User(props: IllustrationProps) {
  const id = useUid()
  return (
    <Svg size={301} {...props}>
      <defs>
        <Rad id={`${id}h`} cx={0.35} cy={0.3} r={0.8} stops={[[0, "1-hi"], [0.45, "1"], [1, "1-lo"]]} />
        <Rad id={`${id}b`} cx={0.3} cy={0.15} r={0.95} stops={[[0, "1-hi"], [0.4, "1"], [1, "1-lo"]]} />
      </defs>
      <path d={BODY} style={grad(`${id}b`)} />
      <circle cx={153} cy={86} r={58} style={grad(`${id}h`)} />
    </Svg>
  )
}
