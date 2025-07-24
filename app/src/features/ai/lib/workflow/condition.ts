import { safe } from "@/lib/safe-async";

import type { OutputSchemaSourceKey } from "./workflow.interface";

/**
 * Condition operators for string-based comparisons.
 * Used to evaluate string values from node outputs.
 */
export enum StringConditionOperator {
    Contains = "contains",
    EndsWith = "ends_with",
    Equals = "equals",
    IsEmpty = "is_empty",
    IsNotEmpty = "is_not_empty",
    NotContains = "not_contains",
    NotEquals = "not_equals",
    StartsWith = "starts_with",
}

/**
 * Condition operators for number-based comparisons.
 * Inherits string equality operators and adds numeric comparisons.
 */
export enum NumberConditionOperator {
    Equals = StringConditionOperator.Equals,
    GreaterThan = "greater_than",
    GreaterThanOrEqual = "greater_than_or_equal",
    LessThan = "less_than",
    LessThanOrEqual = "less_than_or_equal",
    NotEquals = StringConditionOperator.NotEquals,
}

/**
 * Condition operators for boolean value testing.
 */
export enum BooleanConditionOperator {
    IsFalse = "is_false",
    IsTrue = "is_true",
}

/**
 * Gets the default condition operator for a given data type.
 * Used when creating new conditions in the UI.
 */
export function getFirstConditionOperator(type: "string" | "number" | "boolean") {
    switch (type) {
        case "boolean": {
            return BooleanConditionOperator.IsTrue;
        }
        case "number": {
            return NumberConditionOperator.Equals;
        }
        case "string": {
            return StringConditionOperator.Equals;
        }
        default: {
            return StringConditionOperator.Equals;
        }
    }
}

/**
 * Union type of all possible condition operators.
 */
export type ConditionOperator = StringConditionOperator | NumberConditionOperator | BooleanConditionOperator;

/**
 * A single condition rule that compares a value from a node output
 * with a target value using a specified operator.
 */
export type ConditionRule = {
    operator: ConditionOperator;
    source: OutputSchemaSourceKey; // Reference to another node's output field
    value?: string | number | boolean; // Comparison value (not needed for is_empty, is_not_empty, is_true, is_false)
};

/**
 * A condition branch for if-elseIf-else structure.
 * Each branch can have multiple conditions combined with AND/OR logic.
 */
export type ConditionBranch = {
    conditions: ConditionRule[]; // Not needed for 'else' type
    id: "if" | "else" | (string & {});
    logicalOperator: "AND" | "OR"; // How to combine multiple conditions, not needed for 'else'
    type: "if" | "elseIf" | "else";
};

/**
 * Complete condition structure supporting if-elseIf-else branching.
 * Used by Condition nodes to determine execution flow.
 */
export type ConditionBranches = {
    else: ConditionBranch; // Optional else branch
    elseIf?: ConditionBranch[]; // Optional multiple elseIf branches
    if: ConditionBranch;
};

/**
 * Evaluates a condition branch to determine if it should be executed.
 * @param branch The condition branch to evaluate
 * @param getSourceValue Function to get values from node outputs
 * @returns True if the branch conditions are met
 */
export function checkConditionBranch(
    branch: ConditionBranch,
    getSourceValue: (source: OutputSchemaSourceKey) => string | number | boolean | undefined,
): boolean {
    // Evaluate all conditions in the branch
    const results = branch.conditions?.map((condition) =>
        checkConditionRule({
            operator: condition.operator,
            source: getSourceValue(condition.source),
            target: String(condition.value || ""),
        }),
    ) ?? [false];

    // Combine results based on logical operator
    if (branch.logicalOperator === "AND") {
        return results.every(Boolean);
    }

    return results.some(Boolean);
}

/**
 * Evaluates a single condition rule.
 * @param params The condition rule parameters
 * @returns True if the condition is met
 */
function checkConditionRule({ operator, source, target }: { operator: ConditionOperator; source?: string | number | boolean; target: string }): boolean {
    return safe(() => {
        switch (operator) {
            case BooleanConditionOperator.IsFalse: {
                if (!source)
                    return true;

                break;
            }
            case BooleanConditionOperator.IsTrue: {
                if (source)
                    return true;

                break;
            }
            case NumberConditionOperator.GreaterThan: {
                if (Number(source) > Number(target))
                    return true;

                break;
            }
            case NumberConditionOperator.GreaterThanOrEqual: {
                if (Number(source) >= Number(target))
                    return true;

                break;
            }
            case NumberConditionOperator.LessThan: {
                if (Number(source) < Number(target))
                    return true;

                break;
            }
            case NumberConditionOperator.LessThanOrEqual: {
                if (Number(source) <= Number(target))
                    return true;

                break;
            }
            case StringConditionOperator.Contains: {
                if (String(source).includes(String(target)))
                    return true;

                break;
            }
            case StringConditionOperator.EndsWith: {
                if (String(source).endsWith(String(target)))
                    return true;

                break;
            }
            case StringConditionOperator.Equals: {
                if (source === target)
                    return true;

                break;
            }
            case StringConditionOperator.IsEmpty: {
                if (!source)
                    return true;

                break;
            }
            case StringConditionOperator.IsNotEmpty: {
                if (source)
                    return true;

                break;
            }
            case StringConditionOperator.NotContains: {
                if (!String(source).includes(String(target)))
                    return true;

                break;
            }
            case StringConditionOperator.NotEquals: {
                if (source !== target)
                    return true;

                break;
            }
            case StringConditionOperator.StartsWith: {
                if (String(source).startsWith(String(target)))
                    return true;

                break;
            }
        }

        return false;
    })
        .ifFail((e) => {
            console.error("Condition evaluation error:", e);

            return false;
        })
        .unwrap();
}
