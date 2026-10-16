# Concrete source findings

Reviewed against archived `main` commit `e3d7960`. These are source-level findings, not hardware test results. The local lab adds executable math checks and an inspectable controller model without changing the archived competition firmware. Team and third-party attribution remains as recorded in Git and source headers.

## Duration units are accepted but ignored

`Competition/src/main.cpp:528`, `MotionController::straight(directionType, float time, timeUnits units=msec, ...)`, accepts a `units` argument. Its loop compares `t < time`, advances `t` by `0.025`, and waits `0.025` seconds. `units` is never used. A caller supplying 500 milliseconds could therefore request approximately 500 seconds rather than 0.5 seconds.

Bounded remediation for a future firmware revision: convert the supplied unit to seconds once at the boundary, validate a maximum duration, and drive the loop from an elapsed timer. `lab/model.mjs::toSeconds` and its tests demonstrate the intended conversion. Check actual VEX unit constants and robot stop behavior before integration.

## The older smartStraight loop excludes reverse motion

`Competition/src/main.cpp:365`, `smartStraight(float dist)`, forms a target motor position by adding signed distance conversion, then continues only while `leftGroup.position(deg) < wantedMotorPosition`. A negative target offset makes that predicate false initially. Its initial spin commands are forward. A later `MotionController::straight` implementation already uses a sign-aware remaining-distance predicate, so these functions should not be treated as equivalent.

Bounded remediation: consolidate on one direction-aware primitive, test positive/negative/zero travel and encoder-sign assumptions, and add explicit timeout and stop status. The lab's conversion and mirrored-motion tests cover the pure numerical part, not motor firmware integration.

## Collision waits have no total time bound

`Competition/src/main.cpp:406`, `slam(directionType)`, and `Competition/src/main.cpp:558`, `MotionController::slam`, wait for velocity/acceleration conditions without an overall timeout. A sensor condition that never arrives can keep the loop running. The latter closure also has no explicit motor stop after the loop body in the reviewed source.

Bounded remediation: use a maximum duration, return a reason (contact/timeout/cancel), and stop both motor groups on every exit. Validate thresholds against recorded sensor traces and the actual robot before operation. The lab's deliberately stalled-wheel controller test verifies timeout reporting in the separate simulation.

## smartTurn reports success after either exit condition

`Competition/src/main.cpp:243`, `smartTurn`, exits when the error/rate condition is met **or** its timeout is reached, stops the motors, and returns `true` in both cases. Its percentage output is also passed to the motor API without a local symmetric clamp.

Bounded remediation: return a distinguishable settled/timeout result and apply explicit output limits. The educational lab implements a separate bounded controller with anti-windup and a sustained settling condition; its behavior is not presented as a firmware patch or measured improvement.

## Archive publication boundary

GitHub marks this repository archived. The work is prepared and tested locally on `codex/offline-drive-lab`. No attempt was made to unarchive, change repository settings or push into the archived repository. The tested companion is now placed in the separate 7110A-Website destination; the original archive remains unchanged.



## Companion publication

The archived team-code repository remains unchanged. This allowlisted, credential-free companion is published separately in 7110A-Website. Original team-code base: `e3d7960af0ead4ad6b2c89cbdcb92fa4ca036cc6`; local reviewed companion source: `d26b16ec9eecdcb46a01adc0ba33bfc4b78da608`. Navigation links were adapted for this host. See `provenance.json` for source file hashes.
