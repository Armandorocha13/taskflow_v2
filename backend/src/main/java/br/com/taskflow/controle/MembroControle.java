package br.com.taskflow.controle;

import br.com.taskflow.entidade.Membro;
import br.com.taskflow.servico.MembroServico;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/membros")
@CrossOrigin(origins = "*")
public class MembroControle {

    private final MembroServico membroServico;

    public MembroControle(MembroServico membroServico) {
        this.membroServico = membroServico;
    }

    @GetMapping
    public List<Membro> listar() {
        return membroServico.listarTodos();
    }

    @PostMapping
    public Membro criar(@RequestBody Membro membro) {
        return membroServico.salvar(membro);
    }

    @DeleteMapping("/{id}")
    public void excluir(@PathVariable Long id) {
        membroServico.excluir(id);
    }
}
