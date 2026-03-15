package br.com.taskflow.servico;

import br.com.taskflow.entidade.Membro;
import br.com.taskflow.repositorio.MembroRepositorio;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class MembroServico {

    private final MembroRepositorio membroRepositorio;

    public MembroServico(MembroRepositorio membroRepositorio) {
        this.membroRepositorio = membroRepositorio;
    }

    public Membro salvar(Membro membro) {
        return membroRepositorio.save(membro);
    }

    public List<Membro> listarTodos() {
        return membroRepositorio.findAll();
    }

    public Optional<Membro> buscarPorUsuario(String usuario) {
        return membroRepositorio.findByUsuario(usuario);
    }

    public void excluir(Long id) {
        membroRepositorio.deleteById(id);
    }
}
