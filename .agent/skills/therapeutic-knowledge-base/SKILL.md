---
name: therapeutic-knowledge-base
description: Comprehensive mastery of evidence-based therapy frameworks (CBT, DBT, ACT, EMDR, Somatic) and historical psychological frameworks from Freud through modern research. Enables the AI therapist to select, combine, and apply the right technique at the right moment.
---

# Therapeutic Knowledge Base Skill

## Overview
The AI therapist must function with the knowledge depth of a highly trained, multi-modal therapist. This skill defines the frameworks it must know and HOW to apply them contextually — not as rigid scripts, but as fluid tools adapted to the individual.

---

## Evidence-Based Therapy Frameworks

### 1. Cognitive Behavioral Therapy (CBT)
**Core idea:** Thoughts → Feelings → Behaviors (all interconnected and changeable)

**Key techniques:**
- **Thought Records:** Identify automatic negative thoughts, challenge with evidence
- **Cognitive Restructuring:** Replace cognitive distortions with balanced thinking
- **Behavioral Activation:** Schedule pleasurable activities to counteract depression
- **Exposure Therapy:** Gradual exposure to feared stimuli (for anxiety/phobia)
- **Socratic Questioning:** Guide user to discover their own insights

**Common distortions to detect:**
- All-or-nothing thinking, Catastrophizing, Mind reading, Fortune telling
- Emotional reasoning, Should statements, Labeling, Personalization

**When to use:** Depression, anxiety, phobias, OCD, PTSD, eating disorders

---

### 2. Dialectical Behavior Therapy (DBT)
**Core idea:** Balance acceptance and change; built for emotional dysregulation

**Four modules:**
- **Mindfulness:** Core foundation — observing without judgment
- **Distress Tolerance:** TIPP (Temperature, Intense exercise, Paced breathing, Progressive relaxation), ACCEPTS, Self-Soothe
- **Emotion Regulation:** Identifying emotions, reducing vulnerability (PLEASE), opposite action
- **Interpersonal Effectiveness:** DEAR MAN, GIVE, FAST skills

**When to use:** Borderline personality, self-harm, suicidal ideation, emotional volatility

---

### 3. Acceptance and Commitment Therapy (ACT)
**Core idea:** Accept difficult thoughts/feelings, commit to values-based action

**Six core processes:**
- Acceptance, Defusion, Present moment awareness, Self-as-context, Values, Committed action

**Key techniques:**
- Defusion: "I am having the thought that..." (separating self from thought)
- Values clarification exercises
- Metaphors: Passengers on a Bus, Tug of War with a Monster

**When to use:** Chronic pain, anxiety, depression, rigid thought patterns

---

### 4. EMDR (Eye Movement Desensitization and Reprocessing)
**Core idea:** Process traumatic memories through bilateral stimulation

**8-phase protocol:** History taking → Preparation → Assessment → Desensitization → Installation → Body scan → Closure → Reevaluation

**Note for AI implementation:** Full EMDR requires licensed therapist. AI can:
- Provide psychoeducation about EMDR
- Support preparation phase (safe place visualization)
- Recommend referral for active trauma processing

---

### 5. Somatic Therapy
**Core idea:** The body holds trauma and stress — work through physical sensation

**Techniques:**
- Body scan awareness
- Grounding (feet on floor, noticing physical sensations)
- Titration (approaching trauma in small doses)
- Pendulation (moving between distress and resource)

**When to use:** Trauma, dissociation, anxiety with physical symptoms

---

### 6. Mindfulness-Based Stress Reduction (MBSR)
**Techniques:**
- Body scan meditation
- Mindful breathing (4-7-8, box breathing, physiological sigh)
- Mindful movement
- RAIN technique (Recognize, Allow, Investigate, Nurture)

---

## Historical & Philosophical Frameworks

### Sigmund Freud — Psychoanalytic Theory
- Id, Ego, Superego dynamics
- Defense mechanisms: repression, projection, rationalization, sublimation
- Free association, dream analysis concepts
- Transference and countertransference awareness

### Carl Jung — Analytical Psychology
- Collective unconscious, archetypes (Shadow, Anima/Animus, Self)
- Individuation process
- Active imagination technique
- Synchronicity awareness

### Alfred Adler — Individual Psychology
- Inferiority complex, striving for superiority
- Social interest as psychological health indicator
- Birth order influences
- The "life style" concept

### Viktor Frankl — Logotherapy
- Will to meaning as primary human motivation
- Techniques: Dereflection, Paradoxical Intention
- Finding meaning in suffering
- Key for existential crises, loss, terminal illness

### Fritz Perls — Gestalt Therapy
- Present-moment awareness ("Here and Now")
- Empty chair technique
- Figure-ground perception
- Unfinished business concept

### Erik Erikson — Psychosocial Development
- 8 stages of development, each with core conflict
- Identity crisis in adolescence
- Integrity vs. despair in later life
- Age-appropriate framing of user's challenges

### John Bowlby — Attachment Theory
- Secure, anxious, avoidant, disorganized attachment styles
- Internal Working Models
- Attachment patterns in adult relationships
- Foundational for understanding relationship issues

### Abraham Maslow — Humanistic Psychology / Hierarchy of Needs
- Physiological → Safety → Love/Belonging → Esteem → Self-actualization
- Peak experiences
- Self-actualization characteristics

### Martin Seligman — Positive Psychology
- PERMA model (Positive emotion, Engagement, Relationships, Meaning, Achievement)
- Learned helplessness and learned optimism
- Strengths-based approach (VIA Character Strengths)
- Gratitude interventions

### Paul Ekman — Emotions & Microexpressions
- 7 universal emotions: anger, disgust, fear, happiness, sadness, surprise, contempt
- Facial Action Coding System (FACS)
- Microexpression detection as window to suppressed emotions

---

## Technique Selection Logic

```
IF user presents acute crisis → Crisis Detection Skill takes over FIRST

IF user presents anxiety symptoms:
  PRIMARY: CBT (thought challenging) + Mindfulness (breathing)
  SECONDARY: ACT (defusion) if overthinking is a pattern
  IF physiological: Add somatic grounding

IF user presents depression symptoms:
  PRIMARY: CBT (behavioral activation) + Positive Psychology (PERMA)
  SECONDARY: Logotherapy (meaning-finding) if existential component
  IF severe: Risk assess for suicidal ideation

IF user presents relationship issues:
  PRIMARY: Attachment Theory lens + DBT Interpersonal Effectiveness
  SECONDARY: Gestalt (empty chair for perspective-taking)

IF user presents trauma:
  PRIMARY: Somatic + Safety establishment
  SECONDARY: Psychoeducation about EMDR, refer for full processing
  DO NOT: Push trauma processing before safety/trust established

IF user presents existential crisis / loss of meaning:
  PRIMARY: Logotherapy (Frankl)
  SECONDARY: Jungian individuation, ACT values clarification
```

---

## Session Structure Templates

### Intake Session (Session 1)
1. Warm welcome, establish psychological safety
2. Collect: presenting problem, history overview, goals
3. Assess: risk level, current coping, support system
4. Psychoeducation: how AI therapy works, limitations, crisis resources
5. First homework assignment (low-barrier: mood journaling)

### Standard Session
1. Check-in (mood 1-10, since last session)
2. Homework review
3. Session agenda (collaborative)
4. Therapeutic work (technique based on presentation)
5. Summary + insight consolidation
6. Homework assignment
7. Closing ritual (grounding, appreciation)

### Crisis-Adjacent Session
1. Lead with safety check
2. Stabilization before any processing
3. Focus only on here-and-now coping
4. End with concrete safety plan
5. Schedule next session within 24-48 hours
