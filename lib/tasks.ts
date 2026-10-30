import { FaArrowRight, FaCheck, FaCheckDouble, FaExclamationCircle } from "react-icons/fa";

export const taskTypes = [
  'add_material',
  'measure_bin',
  'move_bins',
  'finished_compost',
  'mix_bins',
  'add_water',
  'supply_water',
  'sift_compost',
];

export const tasks = {
  primary: [
    { id: "add_material", icon: FaCheck, label: "Add Material to Bin", path: "adding-material" },
    // { id: "dropoff_grounds", label: "Drop Off Coffee Grounds", path: 'dropoff-grounds'}, // roll into "add material" task
    { id: "measure_bin", icon: FaCheck, label: "Measure Bin", path: "measuring-bin" },
    { id: "move_bins", icon: FaCheck, label: "Move Bins", path: "moving-bins" },
    { id: "finished_compost", icon: FaCheck, label: "Take Finished Compost", path: "finished-compost" },
    { id: "report_issue", icon: FaExclamationCircle, label: "Report Contamination/Issue", path: "litter-page" },
    { id: "other_tasks", icon: FaCheckDouble, label: "More choices...", path: "other-tasks"},
  ],

  other: [
    { id: "mix_bins", icon: FaCheck, label: "Mix Bins", path: "mixing-bins"},
    { id: "add_water", icon: FaCheck, label: "Add Water to Bin", path: 'adding-water'},
    { id: "supply_water", icon: FaCheck, label: "Water - \nFill Jugs/Bring to Barrel", path: 'supply-water'},
    { id: "sift_compost", icon: FaCheck, label: "Sift Finished Compost", path: 'sifting-compost'},
    { id: "primary_tasks", icon: FaCheckDouble, label: "Back", path: "primary-tasks"},
  ]
};

export const flattenedTasks = () => {
    const buttonExclusions = [
      'primary_tasks',
      'other_tasks',
      'report_issue'
    ];

    return [
      ...tasks.primary,
      ...tasks.other
    ].filter(
      // filter out the non-task pseudo-actions, and the litter/contamination option:
      task => ! buttonExclusions.includes(task.id)
    );
}