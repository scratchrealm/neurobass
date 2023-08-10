import json
from dataclasses import dataclass
import pandas as pd
import numpy as np

@dataclass
class NbaOutput:
    dataframe: pd.DataFrame
    num_warmup_draws: int
    variable_prefixes_excluded: list[str]

def load_spa_out(sp_out_fname: str):
    with open(sp_out_fname) as f:
        sp_out = json.load(f)
    chains = sp_out['chains']
    variable_names: list[str] = []
    for chain in chains:
        for variable_name in chain['sequences']:
            if variable_name not in variable_names:
                variable_names.append(variable_name)
    variable_names.sort()
    df = pd.DataFrame(columns=['chain_id', 'draw'] + variable_names)
    for chain in chains:
        chain_id = chain['chainId']
        chain_id_num = int(chain_id.split('_')[-1])
        variable_values: list(np.array) = []
        for variable_name in variable_names:
            if variable_name in chain['sequences']:
                variable_values.append(np.array(chain['sequences'][variable_name]))
            else:
                variable_values.append(np.full_like(variable_values[0], np.nan))
        num_draws = len(variable_values[0])
        for draw in range(num_draws):
            row = [chain_id_num, draw + 1]
            for variable_value in variable_values:
                row.append(variable_value[draw])
            df.loc[len(df)] = row
    return NbaOutput(
        dataframe=df,
        num_warmup_draws=chains[0]['numWarmupDraws'],
        variable_prefixes_excluded=chains[0]['variablePrefixesExcluded']
    )