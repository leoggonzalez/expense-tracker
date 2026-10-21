const { RuleTester } = require("eslint");

const tester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
});
const filename = "/repo/src/components/example/example.tsx";

tester.run(
  "component-props-shape",
  require("../../eslint-rules/component-props-shape"),
  {
    valid: [
      {
        filename,
        code: "interface Props { value: string } export function Example({value}: Props) { return <p>{value}</p> }",
      },
      {
        filename,
        code: "interface Props<T> { value: T } export default function Example(props: Props<string>) { return <p /> }",
      },
      { filename, code: "export function Example() { return <p /> }" },
    ],
    invalid: [
      {
        filename,
        code: "type Props = { value: string }; export function Example(props: Props) { return <p /> }",
        errors: [{ messageId: "interface" }],
      },
      {
        filename,
        code: "export default function Example(props: {value: string}) { return <p /> }",
        errors: [{ messageId: "interface" }],
      },
      {
        filename,
        code: "export function Example(props) { return <p /> }",
        errors: [{ messageId: "interface" }],
      },
    ],
  },
);

tester.run(
  "one_component_per_file",
  require("../../eslint-rules/one_component_per_file"),
  {
    valid: [
      {
        filename,
        code: "export function Example() { return <p /> } export function useExample() {}",
      },
      {
        filename,
        code: "export { First } from './first'; export { Second } from './second';",
      },
      {
        filename,
        code: "export interface Props {} export function Example() { return <p /> }",
      },
    ],
    invalid: [
      {
        filename,
        code: "export function First() { return <p /> } export function Second() { return <p /> }",
        errors: [{ messageId: "multiple" }],
      },
      {
        filename,
        code: "export default function First() { return <p /> } export const Second = () => <p />;",
        errors: [{ messageId: "multiple" }],
      },
      {
        filename,
        code: "function First() { return <p /> } function Second() { return <p /> } export {First, Second};",
        errors: [{ messageId: "multiple" }],
      },
    ],
  },
);
