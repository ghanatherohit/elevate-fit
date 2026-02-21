"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";
import GlassCard from "@/components/shared/GlassCard";
import SectionHeader from "@/components/shared/SectionHeader";
import BodyMap3D from "@/components/workouts/BodyMap3D";

type TableBlock = {
  id: string;
  title: string;
  columns: string[];
  rows: string[][];
  note?: string;
};

type DayPlan = {
  id: string;
  title: string;
  shortTitle: string;
  subtitle?: string;
  blocks: TableBlock[];
};

type AtlasImage = {
  src: string;
  alt: string;
};

type AtlasSection = {
  id: string;
  title: string;
  shortTitle: string;
  subtitle?: string;
  note?: string;
  bullets?: string[];
  images?: AtlasImage[];
  blocks: TableBlock[];
};

type Hotspot = {
  id: string;
  label: string;
  targetId: string;
  position: [number, number, number];
};

type BodyMapView = {
  id: string;
  label: string;
  model: "front" | "back";
  hotspots: Hotspot[];
};



const container = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

const workoutDayKey = [
  { day: "Day 1 & 4", focus: "Chest + Triceps" },
  { day: "Day 2 & 5", focus: "Back + Biceps" },
  { day: "Day 3 & 6", focus: "Legs + Shoulders" },
  { day: "Day 7", focus: "Rest" },
];

const dayPlans: DayPlan[] = [
  {
    id: "day-1",
    title: "Day 1 - Chest + Triceps",
    shortTitle: "Day 1",
    subtitle: "Warm-up, working sets, stretching",
    blocks: [
      {
        id: "day-1-warmup",
        title: "Warm-up and activation (relevant only)",
        columns: ["Area", "Exercises", "Sets", "Reps / Time"],
        rows: [
          ["General", "Treadmill / cycle", "-", "5 min"],
          ["Shoulder joint", "Arm circles", "1", "20"],
          ["Rotator cuff", "Band external rotation", "2", "15"],
          ["Scapular stabilizers", "Band pull-aparts", "2", "15"],
          ["Serratus anterior", "Scapular push-ups", "2", "12"],
          ["Triceps", "Light rope pushdown", "2", "15"],
        ],
      },
      {
        id: "day-1-chest",
        title: "Chest (all relevant muscles)",
        columns: ["Chest muscle / region", "Exercises ( / alternatives)", "Sets", "Reps", "Rest"],
        rows: [
          [
            "Upper chest (clavicular head)",
            "Incline barbell bench press / incline DB press / smith incline press",
            "4",
            "6-8",
            "120s",
          ],
          [
            "Upper chest (isolation)",
            "Low-to-high cable fly / incline DB fly",
            "3",
            "10-12",
            "90s",
          ],
          [
            "Middle chest (sternal head)",
            "Flat barbell bench press / DB bench press / machine chest press",
            "4",
            "6-8",
            "120s",
          ],
          ["Middle chest (assistance)", "Push-ups / feet-elevated push-ups", "2", "AMRAP", "60s"],
          [
            "Lower chest (costal fibers)",
            "Decline bench press / chest dips / decline DB press",
            "3",
            "8-10",
            "90s",
          ],
          [
            "Lower chest (isolation)",
            "High-to-low cable fly / decline cable fly",
            "2",
            "12-15",
            "60s",
          ],
          [
            "Pectoralis major (full stretch)",
            "Pec deck / cable fly (mid) / DB fly",
            "3",
            "12-15",
            "60s",
          ],
          ["Pectoralis minor", "Deep cable fly / ring fly", "2", "12-15", "60s"],
          [
            "Serratus anterior",
            "DB pullover / cable pullover / push-up plus",
            "2",
            "12-15",
            "60s",
          ],
          ["Subclavius", "Pullover hold", "2", "30-40 sec", "45s"],
          [
            "Intercostals (assist breathing)",
            "Pullover breathing / controlled rib breathing",
            "2",
            "10",
            "60s",
          ],
          ["Diaphragm (assist)", "Diaphragmatic breathing", "2", "1 min", "-"],
        ],
      },
      {
        id: "day-1-triceps",
        title: "Triceps (pressing-related muscles)",
        columns: ["Triceps muscle", "Exercises ( / alternatives)", "Sets", "Reps", "Rest"],
        rows: [
          ["All heads (overall mass)", "Close-grip bench press / weighted dips", "3", "6-8", "120s"],
          [
            "Long head",
            "Overhead DB extension / EZ-bar overhead extension / cable overhead extension",
            "3",
            "10-12",
            "60s",
          ],
          [
            "Long head (assist)",
            "Incline skull crushers / single-arm cable overhead extension",
            "2",
            "12-15",
            "60s",
          ],
          [
            "Lateral head",
            "Rope pushdown / straight-bar pushdown / V-bar pushdown",
            "3",
            "12-15",
            "60s",
          ],
          [
            "Lateral head (assist)",
            "Single-arm pushdown / lean-away pushdown",
            "2",
            "12-15",
            "60s",
          ],
          ["Medial head", "Reverse-grip pushdown / close-grip push-ups", "2", "15", "60s"],
          ["Anconeus (elbow stabilizer)", "Cable kickbacks / DB kickbacks", "2", "12-15", "45s"],
        ],
      },
      {
        id: "day-1-stretch",
        title: "Post-workout stretching (chest + triceps only)",
        columns: ["Muscle", "Stretch", "Time"],
        rows: [
          ["Upper and middle chest", "Doorway chest stretch", "30 sec x 2"],
          ["Lower chest", "Dip-bar stretch", "30 sec"],
          ["Serratus / ribs", "Overhead side stretch", "30 sec"],
          ["Triceps long head", "Overhead triceps stretch", "30 sec x 2"],
        ],
      },
    ],
  },
  {
    id: "day-2",
    title: "Day 2 - Back + Biceps",
    shortTitle: "Day 2",
    subtitle: "Warm-up, pulling volume, stretching",
    blocks: [
      {
        id: "day-2-warmup",
        title: "Warm-up and activation",
        columns: ["Area", "Exercises", "Sets", "Reps / Time"],
        rows: [
          ["General", "Rowing / cycle", "-", "5 min"],
          ["Thoracic spine", "Cat-cow", "1", "10"],
          ["Scapula", "Band rows", "2", "15"],
          ["Lower traps", "Y-raises (light)", "2", "12"],
          ["Biceps", "Light DB curls", "2", "15"],
          ["Grip (assist)", "Dead hangs", "2", "30 sec"],
        ],
      },
      {
        id: "day-2-back",
        title: "Back (relevant muscles)",
        columns: ["Back muscle / region", "Exercises ( / alternatives)", "Sets", "Reps", "Rest"],
        rows: [
          ["Lats (width)", "Pull-ups / lat pulldown / neutral-grip pulldown", "4", "8-10", "90s"],
          ["Lats (isolation)", "Straight-arm pulldown / cable pullover", "3", "12-15", "60s"],
          ["Mid-back (thickness)", "Barbell row / DB row / chest-supported row", "4", "6-8", "120s"],
          ["Mid-back (assist)", "Seated cable row / machine row", "3", "10-12", "90s"],
          [
            "Upper back (rear delt tie-in)",
            "Face pulls / rear-delt cable row",
            "3",
            "12-15",
            "60s",
          ],
          ["Trapezius (upper fibers)", "Barbell shrugs / DB shrugs", "3", "12", "90s"],
          ["Trapezius (lower fibers)", "High face pulls / Y-raises", "2", "15", "60s"],
          ["Erector spinae (assist)", "Deadlift / Romanian deadlift", "3", "5-8", "120s"],
          ["Spinal stabilizers (assist)", "Back extensions / reverse hyper", "2", "12", "60s"],
        ],
      },
      {
        id: "day-2-biceps",
        title: "Biceps and arm flexors (relevant muscles)",
        columns: ["Muscle", "Exercises ( / alternatives)", "Sets", "Reps", "Rest"],
        rows: [
          ["Biceps (overall mass)", "Barbell curl / EZ-bar curl", "3", "8-10", "60s"],
          ["Biceps long head", "Incline DB curl / drag curl", "3", "10-12", "60s"],
          ["Biceps short head", "Preacher curl / concentration curl", "3", "10-12", "60s"],
          ["Brachialis", "Hammer curl / cross-body curl", "3", "12", "60s"],
          ["Brachioradialis", "Reverse curl / Zottman curl", "2", "12-15", "60s"],
          ["Coracobrachialis (assist)", "Chin-ups / close-grip pulldown", "2", "8-10", "90s"],
        ],
      },
      {
        id: "day-2-stretch",
        title: "Post-workout stretching (back + biceps only)",
        columns: ["Muscle", "Stretch", "Time"],
        rows: [
          ["Lats", "Overhead lat stretch", "30 sec x 2"],
          ["Mid-back", "Seated row stretch", "30 sec"],
          ["Lower back", "Child's pose", "30 sec"],
          ["Biceps", "Wall biceps stretch", "30 sec x 2"],
          ["Forearms (assist)", "Wrist flexor/extensor stretch", "30 sec"],
        ],
      },
    ],
  },
  {
    id: "day-3",
    title: "Day 3 - Legs + Shoulders",
    shortTitle: "Day 3",
    subtitle: "Lower body plus deltoids",
    blocks: [
      {
        id: "day-3-warmup",
        title: "Warm-up and activation",
        columns: ["Area", "Exercises", "Sets", "Reps / Time"],
        rows: [
          ["General", "Treadmill / cycle", "-", "5 min"],
          ["Hips", "Hip circles", "1", "20"],
          ["Glutes", "Glute bridges", "2", "15"],
          ["Ankles", "Ankle dorsiflexion", "2", "15"],
          ["Shoulders", "Arm swings", "1", "20"],
          ["Rotator cuff", "Band external rotation", "2", "15"],
        ],
      },
      {
        id: "day-3-quads",
        title: "Legs - Quadriceps",
        columns: ["Muscle", "Exercises ( / alternatives)", "Sets", "Reps", "Rest"],
        rows: [
          ["Rectus femoris", "Back squat / front squat / hack squat", "4", "6-8", "120s"],
          ["Vastus lateralis", "Walking lunges / leg press", "3", "10", "90s"],
          ["Vastus medialis", "Leg extension (slow) / Spanish squat", "2", "15", "60s"],
          ["Vastus intermedius", "Leg press (full depth)", "3", "10", "90s"],
        ],
      },
      {
        id: "day-3-hamstrings",
        title: "Legs - Hamstrings",
        columns: ["Muscle", "Exercises", "Sets", "Reps", "Rest"],
        rows: [
          ["Biceps femoris", "Romanian deadlift / stiff-leg deadlift", "3", "8", "120s"],
          ["Semitendinosus", "Seated leg curl", "3", "12", "60s"],
          ["Semimembranosus", "Lying leg curl / assisted Nordic curl", "2", "8-12", "60s"],
        ],
      },
      {
        id: "day-3-glutes",
        title: "Glutes and hip stabilizers",
        columns: ["Muscle", "Exercises", "Sets", "Reps", "Rest"],
        rows: [
          ["Gluteus maximus", "Hip thrust / barbell glute bridge", "3", "10", "90s"],
          ["Gluteus medius", "Side band walks / cable abduction", "2", "20 steps", "45s"],
          ["Gluteus minimus", "Hip abduction machine", "2", "15", "45s"],
          ["Adductors", "Sumo squat / adductor machine", "3", "10-12", "90s"],
          ["Hip flexors", "Hanging leg raises / high knees", "2", "12", "60s"],
        ],
      },
      {
        id: "day-3-calves",
        title: "Calves and lower leg",
        columns: ["Muscle", "Exercises", "Sets", "Reps", "Rest"],
        rows: [
          ["Gastrocnemius", "Standing calf raise / donkey calf raise", "4", "15", "60s"],
          ["Soleus", "Seated calf raise", "3", "15", "60s"],
          ["Tibialis anterior", "Toe raises", "2", "20", "45s"],
        ],
      },
      {
        id: "day-3-shoulders",
        title: "Shoulders (deltoids + rotator cuff)",
        columns: ["Muscle", "Exercises ( / alternatives)", "Sets", "Reps", "Rest"],
        rows: [
          [
            "Anterior deltoid",
            "Overhead barbell press / DB shoulder press / Arnold press",
            "4",
            "6-8",
            "120s",
          ],
          ["Medial deltoid", "DB lateral raise / cable lateral raise", "4", "12-15", "60s"],
          ["Posterior deltoid", "Rear delt fly / reverse pec deck", "3", "15", "60s"],
          ["Supraspinatus", "Scaption raise", "2", "15", "45s"],
          ["Infraspinatus", "External cable rotation", "2", "15", "45s"],
          ["Teres minor", "Face pulls", "2", "15", "45s"],
          ["Subscapularis", "Internal cable rotation", "2", "15", "45s"],
        ],
      },
      {
        id: "day-3-core",
        title: "Core and abs",
        columns: ["Muscle", "Exercises ( / alternatives)", "Sets", "Reps / Time", "Rest"],
        rows: [
          ["Rectus abdominis", "Cable crunch / crunch variation / decline sit-up", "3", "12-15", "45s"],
          ["Lower abs", "Hanging knee raise / reverse crunch", "3", "10-15", "45s"],
          ["Obliques", "Cable woodchop / side plank / Russian twist", "3", "12-15", "45s"],
          ["Transverse abdominis", "Dead bug / hollow hold / bird dog", "3", "20-40s", "30s"],
          ["Spinal stabilizers", "Pallof press / suitcase carry", "2", "12-15", "45s"],
        ],
      },
      {
        id: "day-3-stretch",
        title: "Post-workout stretching (legs + shoulders only)",
        columns: ["Muscle", "Stretch", "Time"],
        rows: [
          ["Quadriceps", "Standing quad stretch", "30 sec x 2"],
          ["Hamstrings", "Seated forward fold", "30 sec x 2"],
          ["Glutes", "Figure-4 stretch", "30 sec"],
          ["Calves", "Wall calf stretch", "30 sec x 2"],
          ["Shoulders", "Cross-body stretch", "30 sec"],
        ],
      },
    ],
  },
];

const atlasSections: AtlasSection[] = [
  {
    id: "atlas-head",
    title: "Head muscle training notes",
    shortTitle: "Head",
    note:
      "These muscles are trained for strength, posture, jaw health, aesthetics, and control. Use slow, controlled movements with bodyweight or isometrics.",
    bullets: [
      "Train daily with light resistance",
      "Focus on symmetry, breathing, and posture",
      "Avoid heavy loads",
    ],
    blocks: [
      {
        id: "atlas-face",
        title: "Facial muscles (expression and control)",
        columns: ["Muscle", "Function", "Exercise", "Home / Gym", "Sets", "Reps / Time"],
        rows: [
          ["Frontalis", "Raises eyebrows", "Eyebrow raises (finger resistance)", "Home", "3", "15-20"],
          ["Orbicularis oculi", "Closes eyes", "Tight eye squeeze", "Home", "3", "15"],
          ["Orbicularis oris", "Lip control", "Lip puckers / whistling", "Home", "3", "20"],
          ["Zygomaticus major", "Smile muscles", "Big smile hold", "Home", "3", "15 sec"],
          ["Buccinator", "Cheek control", "Air-blowing cheeks", "Home", "3", "15"],
          ["Risorius", "Mouth widening", "Wide mouth stretch", "Home", "3", "15"],
          ["Mentalis", "Chin movement", "Chin push-up (lower lip)", "Home", "3", "15"],
        ],
      },
      {
        id: "atlas-jaw",
        title: "Jaw muscles (mastication)",
        columns: ["Muscle", "Function", "Exercise", "Home / Gym", "Sets", "Reps / Time"],
        rows: [
          ["Masseter", "Jaw closing (chewing)", "Chewing gum / jaw clench", "Home", "3", "30-60 sec"],
          ["Temporalis", "Jaw stabilization", "Jaw resistance opening", "Home", "3", "15"],
          ["Medial pterygoid", "Side jaw movement", "Side-to-side jaw press", "Home", "3", "15"],
          ["Lateral pterygoid", "Jaw protrusion", "Forward jaw push", "Home", "3", "15"],
        ],
      },
      {
        id: "atlas-tongue",
        title: "Tongue and internal head muscles",
        columns: ["Muscle", "Function", "Exercise", "Home / Gym", "Sets", "Reps / Time"],
        rows: [
          ["Genioglossus", "Tongue movement", "Tongue press on palate", "Home", "3", "20"],
          ["Styloglossus", "Tongue retraction", "Tongue pull-back", "Home", "3", "15"],
          ["Hyoglossus", "Tongue depression", "Tongue downward press", "Home", "3", "15"],
        ],
      },
      {
        id: "atlas-scalp",
        title: "Scalp muscles",
        columns: ["Muscle", "Function", "Exercise", "Home / Gym", "Sets", "Reps"],
        rows: [["Occipitofrontalis", "Scalp movement", "Scalp contraction (raise ears / forehead)", "Home", "3", "15-20"]],
      },
    ],
  },
  {
    id: "atlas-neck",
    title: "Neck muscles (front, side, back)",
    shortTitle: "Neck",
    note:
      "Train 2-3x per week with light resistance, slow and controlled movement, and a neutral spine.",
    images: [
      {
        src: "https://www.physio-pedia.com/images/thumb/d/d9/STERNO2.png/400px-STERNO2.png",
        alt: "Sternocleidomastoid anatomy",
      },
      {
        src: "https://wikism.org/w/images/thumb/1/15/Deep_Neck_Flexors_Muscles.jpg/1200px-Deep_Neck_Flexors_Muscles.jpg",
        alt: "Deep neck flexors",
      },
    ],
    blocks: [
      {
        id: "atlas-neck-front",
        title: "Front neck muscles (flexors)",
        columns: ["Muscle", "Function", "Exercise", "Home / Gym", "Sets", "Reps / Time"],
        rows: [
          ["Sternocleidomastoid (SCM)", "Neck flexion and rotation", "Neck curl (lying)", "Home", "3", "12-15"],
          ["Longus colli", "Deep neck stability", "Chin tucks", "Home", "3", "15-20"],
          ["Longus capitis", "Head flexion", "Resistance nod", "Home", "3", "12-15"],
          ["Suprahyoid muscles", "Swallowing support", "Tongue-to-roof press", "Home", "3", "15"],
        ],
      },
      {
        id: "atlas-neck-side",
        title: "Side neck muscles (lateral flexors)",
        columns: ["Muscle", "Function", "Exercise", "Home / Gym", "Sets", "Reps / Time"],
        rows: [
          ["Scalenes (ant, mid, post)", "Side bending, breathing", "Side neck raises", "Home", "3", "12-15"],
          ["Sternocleidomastoid (side)", "Head tilt", "Side resistance tilt", "Home", "3", "15"],
          ["Levator scapulae (neck part)", "Neck elevation", "Side shrug hold", "Home", "3", "20 sec"],
        ],
      },
      {
        id: "atlas-neck-back",
        title: "Back neck muscles (extensors)",
        columns: ["Muscle", "Function", "Exercise", "Home / Gym", "Sets", "Reps / Time"],
        rows: [
          ["Splenius capitis", "Head extension", "Prone neck extension", "Home", "3", "12-15"],
          ["Splenius cervicis", "Neck rotation", "Resistance rotation", "Home", "3", "12"],
          ["Semispinalis capitis", "Posture control", "Head lift hold", "Home", "3", "20-30 sec"],
          ["Upper trapezius (neck part)", "Neck elevation", "Shrug hold", "Home / Gym", "3", "15-20"],
        ],
      },
      {
        id: "atlas-neck-deep",
        title: "Deep neck stabilizers",
        columns: ["Muscle", "Function", "Exercise", "Home / Gym", "Sets", "Time"],
        rows: [
          ["Multifidus (cervical)", "Spinal stability", "Chin tuck hold", "Home", "3", "30 sec"],
          ["Suboccipital muscles", "Head positioning", "Micro nods", "Home", "3", "15"],
          ["Deep cervical flexors", "Neck endurance", "Wall chin tuck", "Home", "3", "20 sec"],
        ],
      },
    ],
  },
  {
    id: "atlas-shoulders",
    title: "Shoulders - complete muscle exercise table",
    shortTitle: "Shoulders",
    images: [
      {
        src: "https://cdn.britannica.com/36/113036-050-913798F2/Muscles-shoulder.jpg",
        alt: "Shoulder muscles",
      },
      {
        src: "https://www.getbodysmart.com/wp-content/uploads/2023/07/GBS-scapula-anterior-muscle-attachments-bone-gbs-1024x1024.webp",
        alt: "Scapula muscles",
      },
      {
        src: "https://my.clevelandclinic.org/-/scassets/images/org/health/articles/rotator-cuff",
        alt: "Rotator cuff anatomy",
      },
    ],
    blocks: [
      {
        id: "atlas-shoulders-table",
        title: "Primary, secondary, and stabilizer muscles",
        columns: ["Muscle (region)", "Exercises ( / separated )", "Sets", "Reps / Time"],
        rows: [
          [
            "Anterior deltoid (shoulder)",
            "Front raise / plate raise / band front raise / pike push-up / handstand hold / overhead press / Arnold press / landmine press",
            "3-4",
            "8-15",
          ],
          [
            "Lateral deltoid (shoulder)",
            "Lateral raise / lean-away lateral / cable lateral / upright row (wide) / partial laterals / isometric lateral hold / arm circles",
            "4",
            "12-20",
          ],
          [
            "Posterior deltoid (shoulder)",
            "Reverse fly / bent-over raise / face pull / rear-delt row / band pull-apart / prone Y-raise / inverted rear fly",
            "3-4",
            "12-20",
          ],
          ["Supraspinatus (rotator cuff)", "Scaption raise / light lateral raise / cable scaption / band scaption", "3", "12-15"],
          [
            "Infraspinatus (rotator cuff)",
            "Band external rotation / cable ER / side-lying ER / 90-90 ER hold",
            "3",
            "12-20",
          ],
          ["Teres minor (rotator cuff)", "Side-lying ER / prone ER / band ER / Cuban press (light)", "3", "12-15"],
          [
            "Subscapularis (rotator cuff)",
            "Band internal rotation / cable IR / isometric IR hold / bear crawl",
            "3",
            "12-20",
          ],
          [
            "Serratus anterior (scapular stabilizer)",
            "Wall slides / push-up plus / serratus punches / dynamic hug",
            "3",
            "15-20",
          ],
          [
            "Upper trapezius (shoulder/upper back)",
            "Dumbbell shrug / barbell shrug / farmer carry / trap shrug hold",
            "3-4",
            "10-15",
          ],
          [
            "Middle trapezius (shoulder/upper back)",
            "Face pull / seated row (wide) / band pull-apart / prone T raise",
            "3-4",
            "12-20",
          ],
          [
            "Lower trapezius (shoulder/upper back)",
            "Prone Y hold / face pull-to-Y / scapular depression / straight-arm pulldown",
            "3",
            "15 / 20s",
          ],
          [
            "Rhomboid major (shoulder/upper back)",
            "Seated row / band row / scapular row / inverted row",
            "3-4",
            "10-15",
          ],
          [
            "Rhomboid minor (shoulder/upper back)",
            "Band pull-apart / prone I raise / face pull",
            "3",
            "12-20",
          ],
        ],
      },
    ],
  },
  {
    id: "atlas-chest",
    title: "Chest - complete muscle exercise table",
    shortTitle: "Chest",
    images: [
      {
        src: "https://trainingstation.co.uk/cdn/shop/articles/understanding-chest-muscles_d0766ec4-a0cd-45fd-a2b6-242b267d25bf_1000x.webp?v=1752391099",
        alt: "Chest muscles",
      },
    ],
    blocks: [
      {
        id: "atlas-chest-table",
        title: "Primary and stabilizer muscles",
        columns: ["Muscle (region)", "Exercises ( / separated )", "Sets", "Reps / Time"],
        rows: [
          [
            "Pectoralis major - clavicular (upper chest)",
            "Incline push-up / incline bench press / incline dumbbell press / incline fly / low-to-high cable fly / reverse-grip bench",
            "3-4",
            "8-15",
          ],
          [
            "Pectoralis major - sternal (mid chest)",
            "Push-up / flat bench press / dumbbell bench press / chest press machine / cable press / dumbbell squeeze press",
            "3-4",
            "8-15",
          ],
          [
            "Pectoralis major - costal (lower chest)",
            "Decline push-up / decline bench press / dips (chest lean) / high-to-low cable fly / decline dumbbell fly",
            "3-4",
            "8-15",
          ],
          [
            "Pectoralis minor (deep chest)",
            "Scapular push-up / dip support hold / cable straight-arm pulldown / isometric chest squeeze",
            "3",
            "12-20",
          ],
          [
            "Serratus anterior (chest/scapular stabilizer)",
            "Push-up plus / serratus punches / wall slides / dynamic hug / cable punch",
            "3",
            "15-20",
          ],
          [
            "Subclavius (upper chest stabilizer)",
            "Isometric dip hold / farmer carry (heavy) / scapular depression hold",
            "2-3",
            "20-30s",
          ],
          [
            "Intercostals (rib muscles)",
            "Deep breathing drills / loaded carries / side bends / plank breathing",
            "2-3",
            "30-60s",
          ],
        ],
      },
    ],
  },
  {
    id: "atlas-back",
    title: "Back - prime movers and stabilizers",
    shortTitle: "Back",
    images: [
      {
        src: "https://cdn.britannica.com/19/125819-050-95569B39/Muscles-back.jpg",
        alt: "Back muscles",
      },
    ],
    blocks: [
      {
        id: "atlas-back-table",
        title: "Upper to lower back",
        columns: ["Muscle (region)", "Exercises ( / separated )", "Sets", "Reps / Time"],
        rows: [
          ["Trapezius - upper (upper back)", "Barbell shrug / dumbbell shrug / farmer carry / trap shrug hold", "3-4", "10-15"],
          [
            "Trapezius - middle (upper-mid back)",
            "Face pull / seated row (wide) / band pull-apart / prone T raise",
            "3-4",
            "12-20",
          ],
          [
            "Trapezius - lower (upper-mid back)",
            "Prone Y raise / face pull-to-Y / straight-arm pulldown / scapular depression hold",
            "3",
            "15 / 20s",
          ],
          ["Rhomboid major (mid back)", "Barbell row / dumbbell row / seated cable row / inverted row", "3-4", "8-15"],
          ["Rhomboid minor (mid back)", "Band pull-apart / prone I raise / face pull", "3", "12-20"],
          [
            "Latissimus dorsi (side back)",
            "Pull-up / lat pulldown / straight-arm pulldown / one-arm cable row / dumbbell pullover",
            "3-4",
            "8-15",
          ],
          ["Teres major (upper back)", "Pull-up / lat pulldown / dumbbell pullover / cable pullover", "3", "10-15"],
          ["Teres minor (upper back / cuff assist)", "Face pull / band external rotation / prone ER", "3", "12-15"],
          ["Infraspinatus (upper back / cuff assist)", "Band ER / cable ER / side-lying ER", "3", "12-20"],
          [
            "Erector spinae - iliocostalis (lower back)",
            "Deadlift / back extension / good morning / Superman hold",
            "3-4",
            "8-15 / 30s",
          ],
          [
            "Erector spinae - longissimus (lower back)",
            "Romanian deadlift / reverse hyper / back extension",
            "3-4",
            "8-15",
          ],
          [
            "Erector spinae - spinalis (lower back)",
            "Isometric back extension / bird dog / Superman hold",
            "3",
            "20-40s",
          ],
          ["Multifidus (deep lower back)", "Bird dog / quadruped hold / dead bug", "3", "20-40s"],
          ["Quadratus lumborum (lower back/side)", "Side plank / suitcase carry / hip hike", "3", "20-40s"],
        ],
      },
    ],
  },
  {
    id: "atlas-hips",
    title: "Glutes and hips",
    shortTitle: "Glutes",
    images: [
      {
        src: "https://my.clevelandclinic.org/-/scassets/images/org/health/articles/gluteal-muscles-glutes",
        alt: "Gluteal muscles",
      },
      {
        src: "https://upload.wikimedia.org/wikipedia/commons/e/e2/Anterior_Hip_Muscles_2.PNG",
        alt: "Anterior hip muscles",
      },
    ],
    blocks: [
      {
        id: "atlas-hips-table",
        title: "Glute and hip stabilizers",
        columns: ["Muscle (region)", "Exercises ( / separated )", "Sets", "Reps / Time"],
        rows: [
          [
            "Gluteus maximus (glutes)",
            "Squat / hip thrust / glute bridge / Romanian deadlift / step-up / kettlebell swing / reverse lunge",
            "3-4",
            "8-15",
          ],
          [
            "Gluteus medius (glutes)",
            "Side-lying leg raise / band lateral walk / clamshell / single-leg squat / hip hike",
            "3-4",
            "12-20",
          ],
          [
            "Gluteus minimus (glutes)",
            "Cable hip abduction / side plank with leg lift / band abduction",
            "3",
            "12-20",
          ],
          ["Iliopsoas (hip flexor)", "Hanging knee raise / L-sit / march hold / cable hip flexion", "3", "12-20"],
          ["Psoas minor (deep hip)", "Isometric march / dead bug hold", "2-3", "20-40s"],
          [
            "Tensor fasciae latae - TFL (hip)",
            "Band walks / cable hip abduction / single-leg balance",
            "3",
            "12-20",
          ],
          ["Piriformis (deep hip rotator)", "Clamshell / seated band external rotation / hip external rotation", "3", "12-20"],
          ["Obturator internus (deep hip)", "Band external rotation / side-lying ER", "2-3", "12-20"],
          ["Obturator externus (deep hip)", "Cable ER / seated ER", "2-3", "12-20"],
          ["Gemellus superior (deep hip)", "Band ER / clamshell", "2-3", "12-20"],
          ["Gemellus inferior (deep hip)", "Band ER / clamshell", "2-3", "12-20"],
          ["Quadratus femoris (deep hip)", "Seated ER with band / cable ER", "2-3", "12-20"],
          ["Adductor longus (inner thigh/hip)", "Sumo squat / side lunge / cable adduction / Copenhagen plank", "3-4", "10-20"],
          ["Adductor brevis (inner thigh/hip)", "Narrow-stance squat / cable adduction", "3", "12-20"],
          ["Adductor magnus (inner thigh/hip)", "Deadlift / sumo deadlift / hip thrust / adduction machine", "3-4", "8-15"],
          ["Gracilis (inner thigh/hip)", "Side lunge / Copenhagen plank / band adduction", "3", "12-20"],
          ["Pectineus (inner thigh/hip)", "Cable adduction / march hold", "2-3", "12-20"],
        ],
      },
    ],
  },
  {
    id: "atlas-legs",
    title: "Thighs - quadriceps and hamstrings",
    shortTitle: "Legs",
    images: [
      {
        src: "https://my.clevelandclinic.org/-/scassets/images/org/health/articles/quad-muscles",
        alt: "Quad muscles",
      },
      {
        src: "https://teachmeanatomy.info/wp-content/uploads/Muscles-of-the-Posterior-Thigh..png",
        alt: "Posterior thigh muscles",
      },
    ],
    blocks: [
      {
        id: "atlas-legs-table",
        title: "Quadriceps and hamstrings",
        columns: ["Muscle (region)", "Exercises ( / separated )", "Sets", "Reps / Time"],
        rows: [
          [
            "Rectus femoris (quadriceps)",
            "Squat / front squat / leg press / leg extension / walking lunge / sissy squat",
            "3-4",
            "8-15",
          ],
          [
            "Vastus lateralis (quadriceps)",
            "Back squat / leg press (wide) / hack squat / leg extension (toes in)",
            "3-4",
            "10-20",
          ],
          [
            "Vastus medialis (quadriceps)",
            "Close-stance squat / cyclist squat / leg extension (toes out) / step-down",
            "3-4",
            "10-20",
          ],
          ["Vastus intermedius (quadriceps)", "Squat / leg press / leg extension", "3-4", "10-15"],
          [
            "Biceps femoris - long head (hamstrings)",
            "Romanian deadlift / deadlift / glute-ham raise / stability-ball curl",
            "3-4",
            "8-15",
          ],
          [
            "Biceps femoris - short head (hamstrings)",
            "Seated leg curl / lying leg curl / band curl",
            "3",
            "10-15",
          ],
          ["Semitendinosus (hamstrings)", "Romanian deadlift / Nordic curl / kettlebell swing", "3-4", "8-15"],
          [
            "Semimembranosus (hamstrings)",
            "Good morning / single-leg RDL / cable pull-through",
            "3-4",
            "8-15",
          ],
          ["Sartorius (thigh/hip)", "Step-over lunge / crossover step-up / band-assisted knee raise", "2-3", "12-20"],
        ],
      },
    ],
  },
  {
    id: "atlas-calves",
    title: "Calves and lower leg",
    shortTitle: "Calves",
    images: [
      {
        src: "https://my.clevelandclinic.org/-/scassets/images/org/health/articles/calf-muscle.jpg",
        alt: "Calf muscles",
      },
      {
        src: "https://www.viviangrisogono.com/images/anatomical-diagrams/pg-shin.jpg",
        alt: "Shin muscles",
      },
    ],
    blocks: [
      {
        id: "atlas-calves-table",
        title: "Calf and shin muscles",
        columns: ["Muscle (region)", "Exercises ( / separated )", "Sets", "Reps / Time"],
        rows: [
          [
            "Gastrocnemius - medial head (calf)",
            "Standing calf raise / donkey calf raise / jump rope / sprint drills",
            "3-4",
            "10-20",
          ],
          [
            "Gastrocnemius - lateral head (calf)",
            "Standing calf raise (toes in) / single-leg calf raise / plyometric hops",
            "3-4",
            "10-20",
          ],
          ["Soleus (deep calf)", "Seated calf raise / bent-knee calf raise / isometric calf hold", "3-4", "12-25 / 30-60s"],
          ["Plantaris (calf assist)", "Calf raise / jump rope / isometric ankle plantarflexion", "2-3", "15-25"],
          ["Tibialis anterior (shin)", "Toe raises / band dorsiflexion / heel walk", "3", "15-25"],
          ["Tibialis posterior (deep shin)", "Band inversion / single-leg balance / heel raise (inverted)", "3", "12-20"],
          ["Fibularis longus (outer lower leg)", "Band eversion / lateral hops / single-leg balance", "3", "12-20"],
          ["Fibularis brevis (outer lower leg)", "Band eversion / ankle eversion hold", "3", "12-20"],
          ["Flexor hallucis longus (toe/ankle)", "Single-leg calf raise / toe curls / barefoot calf raises", "3", "12-20"],
          ["Flexor digitorum longus (toe/ankle)", "Towel curls / toe flexion with band / sand walking", "3", "15-25"],
          ["Extensor hallucis longus (toe/ankle)", "Big-toe lifts / band toe extension", "3", "15-25"],
          ["Extensor digitorum longus (toe/ankle)", "Toe lifts / band toe extension / heel walk", "3", "15-25"],
        ],
      },
    ],
  },
  {
    id: "atlas-feet",
    title: "Foot muscles",
    shortTitle: "Feet",
    images: [
      {
        src: "https://www.joionline.net/wp-content/uploads/2020/07/Foot-Muscle-Label-1200x1308.jpg",
        alt: "Foot muscles (plantar)",
      },
      {
        src: "https://upload.orthobullets.com/topic/7003/images/ll1.jpg",
        alt: "Foot muscles (dorsal)",
      },
      {
        src: "https://www.yoganatomy.com/wp-content/uploads/2024/05/foot-muscle-anatomy.jpg",
        alt: "Foot anatomy",
      },
    ],
    blocks: [
      {
        id: "atlas-feet-plantar",
        title: "Plantar and intrinsic muscles",
        columns: ["Muscle (region)", "Exercises ( / separated )", "Sets", "Reps / Time"],
        rows: [
          ["Abductor hallucis (medial plantar)", "Short-foot exercise / toe spread and lift / arch doming", "3", "15-25"],
          [
            "Flexor hallucis brevis (medial plantar)",
            "Big-toe curls / towel curls (big toe focus)",
            "3",
            "15-25",
          ],
          ["Adductor hallucis (deep plantar)", "Ball squeeze between big toe-foot / short-foot hold", "3", "20-40s"],
          ["Abductor digiti minimi (lateral plantar)", "Little-toe abduction / toe spread", "3", "15-25"],
          [
            "Flexor digiti minimi brevis (lateral plantar)",
            "Little-toe curls / towel curls (pinky focus)",
            "3",
            "15-25",
          ],
          ["Quadratus plantae (deep plantar)", "Towel curls / barefoot calf raises", "3", "15-25"],
          ["Lumbricals (plantar)", "Intrinsic-plus toe holds / toe flex-extend drills", "3", "15-20"],
          ["Plantar interossei (plantar)", "Toe adduction against band / coin pinch between toes", "3", "15-25"],
          ["Dorsal interossei (plantar)", "Toe abduction / band toe spreads", "3", "15-25"],
          ["Flexor digitorum brevis (plantar)", "Towel curls / sand walking / barefoot walking", "3", "15-25"],
        ],
      },
      {
        id: "atlas-feet-dorsal",
        title: "Dorsal foot muscles",
        columns: ["Muscle (region)", "Exercises ( / separated )", "Sets", "Reps / Time"],
        rows: [
          ["Extensor digitorum brevis (dorsal foot)", "Toe lifts / band toe extension", "3", "15-25"],
          ["Extensor hallucis brevis (dorsal foot)", "Big-toe lifts / band big-toe extension", "3", "15-25"],
        ],
      },
    ],
  },
];

const bodyMapViews: BodyMapView[] = [
  {
    id: "map-front",
    label: "Front view",
    model: "front",
    hotspots: [
      { id: "hotspot-chest", label: "Chest", targetId: "atlas-chest", position: [0.04691519087453997, 0.08938487487517151, 0.5377861670510502] },
      { id: "hotspot-core", label: "Core", targetId: "atlas-hips", position: [0.11170218607062084, -0.04281699174249245, 0.5788243812891534] },
      { id: "hotspot-thighs", label: "Thighs", targetId: "atlas-legs", position: [-0.028185234304734016, -0.2593131669460013, 0.46056888170484117] },
      { id: "hotspot-calves", label: "Calves", targetId: "atlas-calves", position: [0.016227609821627336, -0.48844875180883646, 0.25087464233037027] },
      { id: "hotspot-feet", label: "Feet", targetId: "atlas-feet", position: [-0.027709805505465524, -0.6334392005019384, 0.49303572020898534] },
      { id: "hotspot-arms", label: "Arms", targetId: "atlas-shoulders", position: [-0.2078284422616432, -0.010642187531088812, 0.22218254913082394] },
      { id: "hotspot-head", label: "Head", targetId: "atlas-head", position: [0.11628860720719446, 0.27729133518627724, 0.5619318693885287] },
    ],
  },
  {
    id: "map-back",
    label: "Back view",
    model: "back",
    hotspots: [
      { id: "hotspot-back", label: "Back", targetId: "atlas-back", position: [0.21088614210119144, 0.11773648943019398, -0.23841976867274256] },
      { id: "hotspot-glutes", label: "Glutes", targetId: "atlas-hips", position: [0.22030853289766525, -0.13379861081608543, -0.10786902937675301] },
      { id: "hotspot-hamstrings", label: "Hamstrings", targetId: "atlas-legs", position: [0.055004591884786284, -0.24022726784408132, -0.008014563164003443] },
    ],
  },
];

const bodyModelUrl = "/Male.OBJ";

const getGridTemplate = (count: number) => `repeat(${count}, minmax(0, 1fr))`;

export default function GymClient() {
  const sectionRefs = useRef<Record<string, HTMLDetailsElement | null>>({});
  const [hoverCoords, setHoverCoords] = useState<[number, number, number] | null>(null);

  const focusSection = (id: string) => {
    const node = sectionRefs.current[id];
    if (!node) return;
    node.open = true;
    node.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const allSections = [...dayPlans, ...atlasSections];

  return (
    <motion.div className="grid gap-5" variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <SectionHeader title="Gym" action="Muscle atlas" />
      </motion.div>

      <motion.div variants={item}>
        <GlassCard className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs text-muted">Workout day key</div>
              <div className="text-sm font-semibold text-foreground">Weekly split overview</div>
            </div>
            <div className="rounded-full border border-border px-3 py-1 text-[10px] text-muted">
              {allSections.length} sections
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {workoutDayKey.map((item) => (
              <div
                key={item.day}
                className="rounded-full border border-border bg-card px-3 py-1 text-[11px] text-foreground"
              >
                <span className="font-semibold">{item.day}</span> · {item.focus}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {allSections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => focusSection(section.id)}
                className="rounded-full border border-border bg-card px-3 py-1 text-[11px] text-muted transition hover:border-accent hover:text-foreground"
              >
                {section.shortTitle}
              </button>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      <motion.div variants={item}>
        <GlassCard className="grid gap-4">
          <div>
            <div className="text-xs text-muted">Select a muscle</div>
            <div className="text-sm font-semibold text-foreground">Body map</div>
            <div className="text-[11px] text-muted">Click the body to reveal a muscle label. Rotate to see the back.</div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
            <div className="rounded-full border border-border bg-card px-3 py-1">
              Hover coords: {hoverCoords ? hoverCoords.map((value) => value.toFixed(2)).join(", ") : "-"}
            </div>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-[radial-gradient(circle_at_top,_rgba(124,108,255,0.12),_rgba(16,21,33,0.95)_60%)]">
            <BodyMap3D
              view="front"
              modelUrl={bodyModelUrl}
              hotspots={[...bodyMapViews[0].hotspots, ...bodyMapViews[1].hotspots]}
              onSelect={focusSection}
              onHoverCoords={setHoverCoords}
            />
          </div>
        </GlassCard>
      </motion.div>

      <motion.div variants={item}>
        <div className="grid gap-4">
          {dayPlans.map((plan, index) => (
            <details
              key={plan.id}
              ref={(node) => {
                sectionRefs.current[plan.id] = node;
              }}
              className="rounded-3xl border border-border bg-card"
              open={index === 0}
            >
              <summary className="cursor-pointer list-none px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs text-muted">Workout day</div>
                    <div className="text-sm font-semibold text-foreground">{plan.title}</div>
                  </div>
                  <div className="rounded-full border border-border px-3 py-1 text-[10px] text-muted">
                    {plan.blocks.length} blocks
                  </div>
                </div>
              </summary>
              <div className="grid gap-4 border-t border-border px-4 py-4">
                {plan.subtitle ? <div className="text-xs text-muted">{plan.subtitle}</div> : null}
                {plan.blocks.map((block) => (
                  <div key={block.id} className="grid gap-2">
                    <div className="text-sm font-semibold text-foreground">{block.title}</div>
                    {block.note ? <div className="text-xs text-muted">{block.note}</div> : null}
                    <div className="grid gap-2">
                      <div
                        className="grid gap-2 text-[10px] uppercase tracking-wide text-muted"
                        style={{ gridTemplateColumns: getGridTemplate(block.columns.length) }}
                      >
                        {block.columns.map((column) => (
                          <div key={column}>{column}</div>
                        ))}
                      </div>
                      {block.rows.map((row, rowIndex) => (
                        <div
                          key={`${block.id}-${rowIndex}`}
                          className="grid gap-2 border-t border-border pt-2 text-[11px] text-foreground"
                          style={{ gridTemplateColumns: getGridTemplate(block.columns.length) }}
                        >
                          {row.map((cell, cellIndex) => (
                            <div key={`${block.id}-${rowIndex}-${cellIndex}`}>{cell}</div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      </motion.div>

      <motion.div variants={item}>
        <div className="grid gap-4">
          {atlasSections.map((section) => (
            <details
              key={section.id}
              ref={(node) => {
                sectionRefs.current[section.id] = node;
              }}
              className="rounded-3xl border border-border bg-card"
            >
              <summary className="cursor-pointer list-none px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs text-muted">Muscle atlas</div>
                    <div className="text-sm font-semibold text-foreground">{section.title}</div>
                  </div>
                  <div className="rounded-full border border-border px-3 py-1 text-[10px] text-muted">
                    {section.blocks.length} tables
                  </div>
                </div>
              </summary>
              <div className="grid gap-4 border-t border-border px-4 py-4">
                {section.subtitle ? <div className="text-xs text-muted">{section.subtitle}</div> : null}
                {section.note ? <div className="text-xs text-muted">{section.note}</div> : null}
                {section.bullets ? (
                  <div className="grid gap-1 text-xs text-muted">
                    {section.bullets.map((bullet) => (
                      <div key={bullet}>- {bullet}</div>
                    ))}
                  </div>
                ) : null}
                {section.images ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {section.images.map((image) => (
                      <img
                        key={image.src}
                        src={image.src}
                        alt={image.alt}
                        className="h-[220px] w-full rounded-2xl border border-border object-cover"
                        loading="lazy"
                      />
                    ))}
                  </div>
                ) : null}
                {section.blocks.map((block) => (
                  <div key={block.id} className="grid gap-2">
                    <div className="text-sm font-semibold text-foreground">{block.title}</div>
                    {block.note ? <div className="text-xs text-muted">{block.note}</div> : null}
                    <div className="grid gap-2">
                      <div
                        className="grid gap-2 text-[10px] uppercase tracking-wide text-muted"
                        style={{ gridTemplateColumns: getGridTemplate(block.columns.length) }}
                      >
                        {block.columns.map((column) => (
                          <div key={column}>{column}</div>
                        ))}
                      </div>
                      {block.rows.map((row, rowIndex) => (
                        <div
                          key={`${block.id}-${rowIndex}`}
                          className="grid gap-2 border-t border-border pt-2 text-[11px] text-foreground"
                          style={{ gridTemplateColumns: getGridTemplate(block.columns.length) }}
                        >
                          {row.map((cell, cellIndex) => (
                            <div key={`${block.id}-${rowIndex}-${cellIndex}`}>{cell}</div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}




